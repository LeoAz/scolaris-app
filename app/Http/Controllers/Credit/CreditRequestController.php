<?php

namespace App\Http\Controllers\Credit;

use App\Enums\CreditRequestStatus;
use App\Events\LoanValidated;
use App\Http\Controllers\Controller;
use App\Jobs\UploadCreditDocument;
use App\Jobs\UploadRepaymentProof;
use App\Models\Country;
use App\Models\CreditRequest;
use App\Models\CreditRequestInstallment;
use App\Models\CreditRequestRepayment;
use App\Models\CreditType;
use App\Models\Stakeholder;
use App\Notifications\CreditRequestCreated;
use App\Notifications\CreditRequestRejected;
use App\Notifications\CreditRequestSubmitted;
use App\Notifications\LoanClosedNotification;
use App\Traits\NotifiesStakeholders;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;
use Inertia\Response;

class CreditRequestController extends Controller
{
    use NotifiesStakeholders;

    public function index(Request $request): Response
    {
        $query = CreditRequest::query()
            ->with(['creditType', 'student', 'country', 'guarantor'])
            ->latest();

        $user = $request->user();
        if (! $user->hasFullAccessToCredits()) {
            $allowedCreditTypeIds = $user->creditTypes()->pluck('credit_types.id');
            $query->whereIn('credit_type_id', $allowedCreditTypeIds);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('code', 'like', "%{$request->search}%")
                    ->orWhereHas('student', function ($sq) use ($request) {
                        $sq->where('first_name', 'like', "%{$request->search}%")
                            ->orWhere('last_name', 'like', "%{$request->search}%");
                    });
            });
        }

        if ($request->filled('country_id')) {
            $query->where('country_id', $request->country_id);
        }

        if ($request->filled('date_start')) {
            $query->whereDate('created_at', '>=', $request->date_start);
        }

        if ($request->filled('date_end')) {
            $query->whereDate('created_at', '<=', $request->date_end);
        }

        $creditRequests = $query->paginate(10)->through(function ($creditRequest) {
            $creditRequest->is_complete = $creditRequest->isComplete();

            if (in_array($creditRequest->status->value, ['valider', 'cloturer', 'resilie'])) {
                $creditRequest->total_repaid = $creditRequest->repayments()->sum('amount');
                $creditRequest->paid_installments_count = $creditRequest->installments()
                    ->where('status', 'paid')
                    ->count();
                $creditRequest->remaining_to_pay = $creditRequest->installments()
                    ->where('status', 'pending')
                    ->sum('total_amount');
                $creditRequest->last_repayment_amount = $creditRequest->repayments()
                    ->latest('repayment_date')
                    ->value('amount') ?? 0;

                $creditRequest->next_installment = $creditRequest->installments()
                    ->where('status', 'pending')
                    ->orderBy('due_date')
                    ->first();
            }

            return $creditRequest;
        })->withQueryString();

        return Inertia::render('credit/index', [
            'creditRequests' => $creditRequests,
            'countries' => Country::all(['id', 'name', 'code']),
            'filters' => $request->only(['status', 'search', 'country_id', 'date_start', 'date_end']),
            'breadcrumbs' => [
                ['title' => 'Gestion des dossiers', 'href' => '/credit/requests'],
            ],
        ]);
    }

    public function create(): Response
    {
        $user = auth()->user();
        $creditTypesQuery = CreditType::query();

        if (! $user->hasFullAccessToCredits()) {
            $creditTypesQuery->whereIn('id', $user->creditTypes()->pluck('credit_types.id'));
        }

        return Inertia::render('credit/create', [
            'countries' => Country::all(['id', 'name', 'code']),
            'creditTypes' => $creditTypesQuery->get(['id', 'name', 'rate', 'duration_months']),
            'breadcrumbs' => [
                ['title' => 'Gestion des dossiers', 'href' => '/credit/requests'],
                ['title' => 'Nouveau dossier', 'href' => '/credit/requests/create'],
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        if (! $user->hasFullAccessToCredits()) {
            $allowedCreditTypeIds = $user->creditTypes()->pluck('credit_types.id')->toArray();
            if (! in_array($request->credit_type_id, $allowedCreditTypeIds)) {
                abort(403, 'Vous n\'êtes pas autorisé à créer ce type de dossier.');
            }
        }

        $request->validate([
            'country_id' => 'required|exists:countries,id',
            'credit_type_id' => 'required|exists:credit_types,id',
            'amount_requested' => 'required|numeric|min:0',
            'initial_contribution' => 'nullable|numeric|min:0',
            'creation_date' => 'required|date',
            'documents' => 'nullable|array',
            'documents.*' => 'nullable|file|max:10240',

            // Student info
            'student.last_name' => 'required|string|max:255',
            'student.first_name' => 'required|string|max:255',
            'student.email' => 'required|email|max:255',
            'student.whatsapp_number' => 'nullable|string|max:255',
            'student.address' => 'nullable|string|max:255',
            'student.profession' => 'nullable|string|max:255',
            'student.amplitude_account' => 'nullable|string|max:255',
            'student.id_card_number' => 'nullable|string|max:255',
            'student.id_card_type' => 'nullable|string|max:255',

            // Guarantor info (optional at first step, but needed for submission)
            'guarantor.id' => 'nullable|exists:stakeholders,id',
            'guarantor.last_name' => 'nullable|string|max:255',
            'guarantor.first_name' => 'nullable|string|max:255',
            'guarantor.email' => 'nullable|email|max:255',
            'guarantor.whatsapp_number' => 'nullable|string|max:255',
            'guarantor.address' => 'nullable|string|max:255',
            'guarantor.profession' => 'nullable|string|max:255',
            'guarantor.amplitude_account' => 'nullable|string|max:255',
            'guarantor.id_card_number' => 'nullable|string|max:255',
            'guarantor.id_card_type' => 'nullable|string|max:255',
        ]);

        return DB::transaction(function () use ($request) {
            // 1. Handle Student (Create or Update)
            $student = Stakeholder::updateOrCreate(
                ['email' => $request->input('student.email')],
                array_merge($request->student, ['type' => 'student'])
            );

            // 2. Handle Guarantor (if provided)
            $guarantorId = null;
            if ($request->filled('guarantor.last_name')) {
                if ($request->filled('guarantor.id')) {
                    $guarantor = Stakeholder::findOrFail($request->input('guarantor.id'));
                    $guarantor->update(array_merge($request->guarantor, ['student_id' => $student->id]));
                    $guarantorId = $guarantor->id;
                } else {
                    $guarantor = Stakeholder::create(array_merge($request->guarantor, [
                        'type' => 'guarantor',
                        'student_id' => $student->id,
                    ]));
                    $guarantorId = $guarantor->id;
                }
            }

            // 3. Generate Code
            $country = Country::findOrFail($request->country_id);
            $code = CreditRequest::generateCode($country, $student);

            // 4. Create Credit Request
            $creditRequest = CreditRequest::create([
                'code' => $code,
                'country_id' => $request->country_id,
                'credit_type_id' => $request->credit_type_id,
                'student_id' => $student->id,
                'guarantor_id' => $guarantorId,
                'amount_requested' => $request->amount_requested,
                'initial_contribution' => $request->initial_contribution ?? 0,
                'created_at' => $request->creation_date,
                'status' => CreditRequestStatus::CREATION->value,
                'created_by_id' => auth()->id(),
            ]);

            $creditRequest->calculateFees();
            $creditRequest->save();

            $creditRequest->activities()->create([
                'user_id' => auth()->id(),
                'action' => 'creation',
                'description' => 'Création initiale du dossier.',
            ]);

            if ($request->hasFile('documents')) {
                foreach ($request->file('documents') as $file) {
                    $creditRequest->addMedia($file)->toMediaCollection('documents');
                }
            }

            // 5. Send Notifications
            $allRecipients = $this->getStakeholders($creditRequest->country_id)
                ->push(auth()->user())
                ->unique('id');

            Notification::send($allRecipients, new CreditRequestCreated($creditRequest));

            return redirect()->route('credit.show', $creditRequest->id)->with('success', 'Dossier créé avec succès.');
        });
    }

    public function edit(CreditRequest $creditRequest): Response
    {
        $this->authorize('view', $creditRequest);

        $creditRequest->load(['student', 'guarantor', 'media']);

        return Inertia::render('credit/edit', [
            'creditRequest' => array_merge($creditRequest->toArray(), [
                'media' => $creditRequest->media,
                'required_document_types' => CreditRequest::getRequiredDocumentTypes(),
            ]),
            'countries' => Country::all(['id', 'name', 'code']),
            'creditTypes' => CreditType::all(['id', 'name', 'rate', 'duration_months']),
            'breadcrumbs' => [
                ['title' => 'Gestion des dossiers', 'href' => '/credit/requests'],
                ['title' => "Modifier {$creditRequest->code}", 'href' => "/credit/requests/{$creditRequest->id}/edit"],
            ],
        ]);
    }

    public function update(Request $request, CreditRequest $creditRequest): RedirectResponse
    {
        $this->authorize('update', $creditRequest);

        $request->validate([
            'country_id' => 'required|exists:countries,id',
            'credit_type_id' => 'required|exists:credit_types,id',
            'amount_requested' => 'required|numeric|min:0',
            'initial_contribution' => 'nullable|numeric|min:0',
            'creation_date' => 'required|date',
            'documents' => 'nullable|array',
            'documents.*' => 'nullable|file|max:10240',

            // Student info
            'student.id' => 'required|exists:stakeholders,id',
            'student.last_name' => 'required|string|max:255',
            'student.first_name' => 'required|string|max:255',
            'student.email' => 'required|email|max:255',
            'student.amplitude_account' => 'nullable|string|max:255',
            'student.id_card_number' => 'nullable|string|max:255',
            'student.id_card_type' => 'nullable|string|max:255',

            // Guarantor info
            'guarantor.id' => 'nullable|exists:stakeholders,id',
            'guarantor.last_name' => 'nullable|string|max:255',
            'guarantor.first_name' => 'nullable|string|max:255',
            'guarantor.amplitude_account' => 'nullable|string|max:255',
            'guarantor.id_card_number' => 'nullable|string|max:255',
            'guarantor.id_card_type' => 'nullable|string|max:255',
        ]);

        DB::transaction(function () use ($request, $creditRequest) {
            // Update Student
            $student = Stakeholder::findOrFail($request->input('student.id'));
            $student->update($request->student);

            // Update/Create Guarantor
            $guarantorId = $creditRequest->guarantor_id;
            if ($request->filled('guarantor.last_name')) {
                if ($request->filled('guarantor.id')) {
                    $guarantor = Stakeholder::findOrFail($request->input('guarantor.id'));
                    $guarantor->update(array_merge($request->guarantor, ['student_id' => $creditRequest->student_id]));
                    $guarantorId = $guarantor->id;
                } else {
                    $guarantor = Stakeholder::create(array_merge($request->guarantor, [
                        'type' => 'guarantor',
                        'student_id' => $creditRequest->student_id,
                    ]));
                    $guarantorId = $guarantor->id;
                }
            }

            // Update Credit Request
            $creditRequest->update([
                'country_id' => $request->country_id,
                'credit_type_id' => $request->credit_type_id,
                'guarantor_id' => $guarantorId,
                'amount_requested' => $request->amount_requested,
                'initial_contribution' => $request->initial_contribution ?? 0,
                'created_at' => $request->creation_date,
            ]);

            $creditRequest->calculateFees();
            $creditRequest->save();

            $creditRequest->activities()->create([
                'user_id' => auth()->id(),
                'action' => 'update',
                'description' => 'Mise à jour des informations du dossier.',
            ]);

            if ($request->hasFile('documents')) {
                foreach ($request->file('documents') as $file) {
                    $creditRequest->addMedia($file)->toMediaCollection('documents');
                }
            }
        });

        return redirect()->route('credit.show', $creditRequest->id)->with('success', 'Dossier mis à jour avec succès.');
    }

    public function searchGuarantor(Request $request)
    {
        $search = $request->input('query');

        $guarantors = Stakeholder::where('type', 'guarantor')
            ->where(function ($q) use ($search) {
                $q->where('last_name', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('whatsapp_number', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            })
            ->limit(5)
            ->get();

        return response()->json($guarantors);
    }

    public function show(CreditRequest $creditRequest): Response
    {
        $this->authorize('view', $creditRequest);

        $creditRequest->load(['creditType', 'student', 'guarantor', 'country', 'creator', 'validator', 'rejector', 'media']);

        $creditRequest->media->each(function ($media) {
            $media->setAttribute('original_url', $media->getTemporaryUrl(now()->addMinutes(60)));
        });

        $activities = $creditRequest->activities()
            ->with('user')
            ->paginate(10, ['*'], 'activities_page')
            ->withQueryString();

        return Inertia::render('credit/show', [
            'creditRequest' => array_merge($creditRequest->toArray(), [
                'is_complete' => $creditRequest->isComplete(),
                'missing_documents' => $creditRequest->getMissingDocuments(),
                'required_document_types' => CreditRequest::getRequiredDocumentTypes(),
                'media' => $creditRequest->media,
                'activities' => Inertia::merge(fn () => $activities),
            ]),
            'breadcrumbs' => [
                ['title' => 'Gestion des dossiers', 'href' => '/credit/requests'],
                ['title' => "Détails {$creditRequest->code}", 'href' => "/credit/requests/{$creditRequest->id}"],
            ],
        ]);
    }

    public function summary(CreditRequest $creditRequest)
    {
        $this->authorize('view', $creditRequest);

        $creditRequest->load(['creditType', 'student', 'guarantor', 'country', 'installments', 'repayments.installment']);

        $pdf = Pdf::loadView('pdf.credit-request-summary', [
            'creditRequest' => $creditRequest,
            'student' => $creditRequest->student,
            'guarantor' => $creditRequest->guarantor,
            'creditType' => $creditRequest->creditType,
            'installments' => $creditRequest->installments,
        ]);

        return $pdf->stream("recapitulatif_dossier_{$creditRequest->code}.pdf");
    }

    public function submit(CreditRequest $creditRequest): RedirectResponse
    {
        if ($creditRequest->status !== CreditRequestStatus::CREATION) {
            return back()->with('error', "Le dossier n'est pas dans un état permettant la soumission.");
        }

        $creditRequest->update([
            'status' => CreditRequestStatus::SOUMIS->value,
            'submitted_at' => now(),
        ]);

        $creditRequest->activities()->create([
            'user_id' => auth()->id(),
            'action' => 'submission',
            'description' => 'Le dossier a été soumis pour validation.',
        ]);

        // Envoyer la notification
        $recipients = $this->getStakeholders($creditRequest->country_id);

        if ($recipients->isNotEmpty()) {
            Notification::send($recipients, new CreditRequestSubmitted($creditRequest));
            \Log::info('Notifications de soumission envoyées à '.$recipients->count().' destinataires.');
        } else {
            \Log::warning('Aucun destinataire trouvé pour la notification de soumission du dossier '.$creditRequest->code);
        }

        // Notifier aussi le créateur du dossier via l'application
        $creditRequest->creator->notify(new CreditRequestSubmitted($creditRequest));
        \Log::info('Notification de soumission envoyée au créateur: '.$creditRequest->creator->email);

        return back()->with('success', 'Dossier soumis avec succès.');
    }

    public function validateRequest(CreditRequest $creditRequest): RedirectResponse
    {
        if ($creditRequest->status !== CreditRequestStatus::SOUMIS) {
            return back()->with('error', "Le dossier n'est pas dans un état permettant la validation.");
        }

        // Vérifier si tous les documents sont présents (Exception pour Admin et Super Admin)
        $isAdmin = auth()->user()->hasAnyRole(['Administrateur', 'Super admin']);

        if (! $creditRequest->isComplete() && ! $isAdmin) {
            return back()->with('error', 'Le dossier est incomplet. Veuillez vérifier que tous les documents requis sont présents.');
        }

        $creditRequest->update([
            'status' => CreditRequestStatus::VALIDER->value,
            'validated_at' => now(),
            'validated_by_id' => auth()->id(),
        ]);

        $creditRequest->activities()->create([
            'user_id' => auth()->id(),
            'action' => 'validation',
            'description' => 'Le dossier a été validé.',
        ]);

        // Déclencher l'événement de validation du prêt (calcul amortissement, notifications)
        LoanValidated::dispatch($creditRequest);

        return back()->with('success', 'Dossier validé avec succès.');
    }

    public function rejectRequest(Request $request, CreditRequest $creditRequest): RedirectResponse
    {
        if ($creditRequest->status !== CreditRequestStatus::SOUMIS) {
            return back()->with('error', "Le dossier n'est pas dans un état permettant le rejet.");
        }

        $creditRequest->update([
            'status' => CreditRequestStatus::REJETER->value,
            'rejected_at' => now(),
            'rejected_by_id' => auth()->id(),
            'rejection_reason' => $request->input('reason'),
        ]);

        $creditRequest->activities()->create([
            'user_id' => auth()->id(),
            'action' => 'rejection',
            'description' => 'Le dossier a été rejeté. Motif : '.$request->input('reason', 'Non spécifié'),
        ]);

        // Destinataires : Admin, Super admin, Controleur (Dossier), Validateurs liés au pays, et le créateur
        $recipients = $this->getStakeholders($creditRequest->country_id)
            ->push($creditRequest->creator)
            ->filter()
            ->unique('id');

        Notification::send($recipients, new CreditRequestRejected($creditRequest, $request->input('reason')));

        return back()->with('success', 'Dossier rejeté avec succès.');
    }

    public function resiliate(CreditRequest $creditRequest): RedirectResponse
    {
        $creditRequest->update([
            'status' => CreditRequestStatus::RESILIE->value,
        ]);

        $creditRequest->activities()->create([
            'user_id' => auth()->id(),
            'action' => 'resiliation',
            'description' => 'Le dossier a été résilié.',
        ]);

        // Notifier les parties prenantes
        $recipients = $this->getStakeholders($creditRequest->country_id)
            ->push($creditRequest->creator)
            ->filter()
            ->unique('id');

        // Note: On pourrait créer une notification spécifique mais Rejet peut suffire ou on utilise une notification générique
        Notification::send($recipients, new CreditRequestRejected($creditRequest, 'Résiliation du dossier'));

        return back()->with('success', 'Dossier résilié avec succès.');
    }

    public function cloturer(CreditRequest $creditRequest): RedirectResponse
    {
        $creditRequest->update([
            'status' => CreditRequestStatus::CLOTURER->value,
        ]);

        $creditRequest->activities()->create([
            'user_id' => auth()->id(),
            'action' => 'cloture',
            'description' => 'Le dossier a été clôturé.',
        ]);

        // Notifier les parties prenantes
        $recipients = $this->getStakeholders($creditRequest->country_id)
            ->push($creditRequest->creator)
            ->filter()
            ->unique('id');

        Notification::send($recipients, new LoanClosedNotification($creditRequest));

        return back()->with('success', 'Dossier clôturé avec succès.');
    }

    public function destroy(CreditRequest $creditRequest)
    {
        $creditRequest->delete();

        return redirect()->route('credit.index')->with('success', 'Dossier supprimé avec succès.');
    }

    public function uploadDocument(Request $request, CreditRequest $creditRequest)
    {
        $request->validate([
            'documents' => 'required|array',
            'documents.*' => 'required|file|max:10240',
            'types' => 'required|array',
            'types.*' => 'required|string',
        ]);

        foreach ($request->file('documents') as $index => $file) {
            $type = $request->input('types')[$index];

            // Store file temporarily
            $tempPath = $file->store('temp-uploads', 'local');

            // Dispatch job
            UploadCreditDocument::dispatch(
                $creditRequest,
                $tempPath,
                $file->getClientOriginalName(),
                $type,
                auth()->id()
            );
        }

        return back()->with('success', 'Documents mis en file d\'attente pour upload.');
    }

    public function deleteDocument(CreditRequest $creditRequest, $mediaId)
    {
        $media = $creditRequest->media()->findOrFail($mediaId);
        $type = $media->getCustomProperty('type');
        $label = CreditRequest::getRequiredDocumentTypes()[$type] ?? $type;

        $creditRequest->activities()->create([
            'user_id' => auth()->id(),
            'action' => 'document_delete',
            'description' => "Suppression du document : {$label}",
            'properties' => ['type' => $type],
        ]);

        $media->delete();

        return back()->with('success', 'Document supprimé avec succès.');
    }

    public function installments(CreditRequest $creditRequest): Response
    {
        $creditRequest->load([
            'creditType',
            'student',
            'guarantor',
            'country',
            'installments.repayments',
            'repayments.installment',
            'repayments.media',
        ]);

        $nextInstallment = $creditRequest->installments()
            ->where('status', 'pending')
            ->orderBy('due_date', 'asc')
            ->first();

        $totalRepaid = $creditRequest->repayments()
            ->where('status', 'validated')
            ->sum('amount');

        return Inertia::render('credit/installments', [
            'creditRequest' => array_merge($creditRequest->toArray(), [
                'installments' => $creditRequest->installments,
                'repayments' => $creditRequest->repayments->map(function ($repayment) {
                    $repayment->proof_url = $repayment->getFirstTemporaryUrl(now()->addMinutes(60), 'proof_of_payment');

                    return $repayment;
                }),
                'total_repaid' => $totalRepaid,
            ]),
            'nextInstallment' => $nextInstallment,
            'breadcrumbs' => [
                ['title' => 'Gestion des dossiers', 'href' => '/credit/requests'],
                ['title' => "Détails {$creditRequest->code}", 'href' => "/credit/requests/{$creditRequest->id}"],
                ['title' => 'Échéancier', 'href' => "/credit/requests/{$creditRequest->id}/installments"],
            ],
        ]);
    }

    public function recordRepayment(Request $request, CreditRequest $creditRequest, CreditRequestInstallment $installment): RedirectResponse
    {
        $request->validate([
            'amount' => 'required|numeric|min:0',
            'repayment_date' => 'required|date',
            'payment_method' => 'required|string',
            'reference' => 'nullable|string',
            'notes' => 'nullable|string',
            'proof' => 'required|file|max:10240',
        ]);

        $repayment = DB::transaction(function () use ($request, $creditRequest, $installment) {
            $repayment = $installment->repayments()->create([
                'credit_request_id' => $creditRequest->id,
                'amount' => $request->amount,
                'repayment_date' => $request->repayment_date,
                'payment_method' => $request->payment_method,
                'reference' => $request->reference,
                'notes' => $request->notes,
                'status' => 'pending',
            ]);

            // Store file temporarily
            $file = $request->file('proof');
            $tempPath = $file->store('temp-proofs', 'local');

            // Dispatch job
            UploadRepaymentProof::dispatch(
                $repayment,
                $tempPath,
                $file->getClientOriginalName(),
                auth()->id()
            );

            $creditRequest->activities()->create([
                'user_id' => auth()->id(),
                'action' => 'repayment_submission',
                'description' => "Soumission d'un remboursement de {$request->amount} pour l'échéance n°{$installment->installment_number}.",
                'properties' => [
                    'installment_id' => $installment->id,
                    'amount' => $request->amount,
                    'repayment_id' => $repayment->id,
                ],
            ]);

            return $repayment;
        });

        return back()->with('success', 'Remboursement soumis avec succès. Il sera validé après vérification de la preuve.');
    }

    public function validateRepayment(CreditRequest $creditRequest, CreditRequestRepayment $repayment): RedirectResponse
    {
        if ($repayment->status === 'validated') {
            return back()->with('error', 'Ce remboursement est déjà validé.');
        }

        DB::transaction(function () use ($creditRequest, $repayment) {
            $repayment->update([
                'status' => 'validated',
                'validated_at' => now(),
                'validated_by_id' => auth()->id(),
            ]);

            // Mise à jour du statut de l'échéance si le montant total validé est payé
            $installment = $repayment->installment;
            $totalValidatedPaid = $installment->repayments()
                ->where('status', 'validated')
                ->sum('amount');

            if ($totalValidatedPaid >= $installment->total_amount) {
                $installment->update(['status' => 'paid']);
            }

            $creditRequest->activities()->create([
                'user_id' => auth()->id(),
                'action' => 'repayment_validation',
                'description' => "Validation du remboursement de {$repayment->amount} pour l'échéance n°{$installment->installment_number}.",
                'properties' => [
                    'installment_id' => $installment->id,
                    'amount' => $repayment->amount,
                    'repayment_id' => $repayment->id,
                ],
            ]);
        });

        return back()->with('success', 'Remboursement validé avec succès.');
    }

    public function rejectRepayment(Request $request, CreditRequest $creditRequest, CreditRequestRepayment $repayment): RedirectResponse
    {
        $request->validate([
            'reason' => 'required|string|max:255',
        ]);

        if ($repayment->status === 'validated') {
            return back()->with('error', 'Un remboursement validé ne peut pas être rejeté.');
        }

        DB::transaction(function () use ($creditRequest, $repayment, $request) {
            $repayment->update([
                'status' => 'rejected',
                'notes' => $repayment->notes."\n\nMotif du rejet : ".$request->reason,
            ]);

            $creditRequest->activities()->create([
                'user_id' => auth()->id(),
                'action' => 'repayment_rejection',
                'description' => "Rejet du remboursement de {$repayment->amount} pour l'échéance n°{$repayment->installment->installment_number}.",
                'properties' => [
                    'installment_id' => $repayment->installment_id,
                    'amount' => $repayment->amount,
                    'repayment_id' => $repayment->id,
                    'reason' => $request->reason,
                ],
            ]);
        });

        return back()->with('success', 'Remboursement rejeté.');
    }
}

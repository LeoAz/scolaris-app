<?php

namespace App\Http\Controllers\Credit;

use App\Actions\Credit\CloseCreditRequest;
use App\Actions\Credit\CreateCreditRequest;
use App\Actions\Credit\RecordRepayment;
use App\Actions\Credit\RejectCreditRequest;
use App\Actions\Credit\RejectRepayment;
use App\Actions\Credit\ResiliateCreditRequest;
use App\Actions\Credit\SubmitCreditRequest;
use App\Actions\Credit\UpdateCreditRequest;
use App\Actions\Credit\ValidateCreditRequest;
use App\Actions\Credit\ValidateRepayment;
use App\Enums\CreditRequestStatus;
use App\Http\Controllers\Controller;
use App\Jobs\UploadCreditDocument;
use App\Models\Country;
use App\Models\CreditRequest;
use App\Models\CreditRequestInstallment;
use App\Models\CreditRequestRepayment;
use App\Models\CreditType;
use App\Models\Stakeholder;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class CreditRequestController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('can:viewAny,'.CreditRequest::class, only: ['index']),
            new Middleware('can:create,'.CreditRequest::class, only: ['create', 'store']),
            new Middleware('can:view,creditRequest', only: ['show', 'summary', 'installments']),
            new Middleware('can:update,creditRequest', only: ['edit', 'update', 'uploadDocument']),
            new Middleware('can:delete,creditRequest', only: ['destroy']),
        ];
    }

    public function __construct() {}

    public function index(Request $request): Response
    {
        $query = CreditRequest::query()
            ->with(['creditType', 'student', 'country', 'guarantor'])
            ->latest();

        $user = $request->user();
        if (! $user->hasFullAccessToCredits()) {
            $allowedCreditTypeIds = $user->creditTypes()->pluck('credit_types.id');
            $query->whereIn('credit_type_id', $allowedCreditTypeIds);

            $allowedCountryIds = $user->countries()->pluck('countries.id');
            $query->whereIn('country_id', $allowedCountryIds);
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

        $countriesQuery = Country::query();
        if (! $user->hasFullAccessToCredits()) {
            $countriesQuery->whereIn('id', $user->countries()->pluck('countries.id'));
        }

        return Inertia::render('credit/index', [
            'creditRequests' => $creditRequests,
            'countries' => $countriesQuery->get(['id', 'name', 'code']),
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
        $countriesQuery = Country::query();

        if (! $user->hasFullAccessToCredits()) {
            $creditTypesQuery->whereIn('id', $user->creditTypes()->pluck('credit_types.id'));
            $countriesQuery->whereIn('id', $user->countries()->pluck('countries.id'));
        }

        return Inertia::render('credit/create', [
            'countries' => $countriesQuery->get(['id', 'name', 'code']),
            'creditTypes' => $creditTypesQuery->get(['id', 'name', 'rate', 'duration_months']),
            'breadcrumbs' => [
                ['title' => 'Gestion des dossiers', 'href' => '/credit/requests'],
                ['title' => 'Nouveau dossier', 'href' => '/credit/requests/create'],
            ],
        ]);
    }

    public function store(Request $request, CreateCreditRequest $action): RedirectResponse
    {
        $user = $request->user();
        if (! $user->hasFullAccessToCredits()) {
            $allowedCreditTypeIds = $user->creditTypes()->pluck('credit_types.id')->toArray();
            if (! in_array($request->input('credit_type_id'), $allowedCreditTypeIds)) {
                abort(403, 'Vous n\'êtes pas autorisé à créer ce type de dossier.');
            }

            $allowedCountryIds = $user->countries()->pluck('countries.id')->toArray();
            if (! in_array($request->input('country_id'), $allowedCountryIds)) {
                abort(403, 'Vous n\'êtes pas autorisé à créer un dossier pour ce pays.');
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
            'student.email' => 'required|email|max:255|unique:stakeholders,email',
            'student.whatsapp_number' => 'required|string|max:255',
            'student.address' => 'nullable|string|max:255',
            'student.profession' => 'nullable|string|max:255',
            'student.amplitude_account' => 'nullable|string|max:255',
            'student.id_card_number' => 'nullable|string|max:255',
            'student.id_card_type' => 'nullable|string|max:255',

            // Guarantor info (mandatory)
            'guarantor.id' => 'nullable|exists:stakeholders,id',
            'guarantor.last_name' => 'required|string|max:255',
            'guarantor.first_name' => 'required|string|max:255',
            'guarantor.email' => 'nullable|email|max:255|unique:stakeholders,email',
            'guarantor.whatsapp_number' => 'required|string|max:255',
            'guarantor.address' => 'nullable|string|max:255',
            'guarantor.profession' => 'nullable|string|max:255',
            'guarantor.id_card_number' => 'nullable|string|max:255',
            'guarantor.id_card_type' => 'nullable|string|max:255',
        ], [
            'student.whatsapp_number.required' => 'Le numéro WhatsApp de l\'étudiant est obligatoire.',
            'guarantor.last_name.required' => 'Le nom du garant est obligatoire.',
            'guarantor.first_name.required' => 'Le prénom du garant est obligatoire.',
            'guarantor.whatsapp_number.required' => 'Le numéro WhatsApp du garant est obligatoire.',
            'student.email.unique' => 'Cet email est déjà utilisé par un autre étudiant ou garant.',
            'guarantor.email.unique' => 'Cet email est déjà utilisé par un autre étudiant ou garant.',
        ]);

        $creditRequest = $action->execute($request);

        return redirect()->route('credit.show', $creditRequest->id)->with('success', 'Dossier créé avec succès.');
    }

    public function edit(CreditRequest $creditRequest): Response
    {
        $this->authorize('view', $creditRequest);

        $user = auth()->user();
        $countriesQuery = Country::query();
        $creditTypesQuery = CreditType::query();

        if (! $user->hasFullAccessToCredits()) {
            $countriesQuery->whereIn('id', $user->countries()->pluck('countries.id'));
            $creditTypesQuery->whereIn('id', $user->creditTypes()->pluck('credit_types.id'));
        }

        return Inertia::render('credit/edit', [
            'creditRequest' => array_merge($creditRequest->toArray(), [
                'media' => $creditRequest->media,
                'required_document_types' => CreditRequest::getRequiredDocumentTypes(),
            ]),
            'countries' => $countriesQuery->get(['id', 'name', 'code']),
            'creditTypes' => $creditTypesQuery->get(['id', 'name', 'rate', 'duration_months']),
            'breadcrumbs' => [
                ['title' => 'Gestion des dossiers', 'href' => '/credit/requests'],
                ['title' => "Modifier {$creditRequest->code}", 'href' => "/credit/requests/{$creditRequest->id}/edit"],
            ],
        ]);
    }

    public function update(Request $request, CreditRequest $creditRequest, UpdateCreditRequest $action): RedirectResponse
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
            'student.email' => 'required|email|max:255|unique:stakeholders,email,'.$request->input('student.id'),
            'student.whatsapp_number' => 'required|string|max:255',
            'student.amplitude_account' => 'nullable|string|max:255',
            'student.id_card_number' => 'nullable|string|max:255',
            'student.id_card_type' => 'nullable|string|max:255',

            // Guarantor info
            'guarantor.id' => 'nullable|exists:stakeholders,id',
            'guarantor.last_name' => 'required|string|max:255',
            'guarantor.first_name' => 'required|string|max:255',
            'guarantor.email' => 'nullable|email|max:255|unique:stakeholders,email,'.$request->input('guarantor.id'),
            'guarantor.whatsapp_number' => 'required|string|max:255',
            'guarantor.id_card_number' => 'nullable|string|max:255',
            'guarantor.id_card_type' => 'nullable|string|max:255',
        ], [
            'student.whatsapp_number.required' => 'Le numéro WhatsApp de l\'étudiant est obligatoire.',
            'guarantor.last_name.required' => 'Le nom du garant est obligatoire.',
            'guarantor.first_name.required' => 'Le prénom du garant est obligatoire.',
            'guarantor.whatsapp_number.required' => 'Le numéro WhatsApp du garant est obligatoire.',
            'student.email.unique' => 'Cet email est déjà utilisé par un autre étudiant ou garant.',
            'guarantor.email.unique' => 'Cet email est déjà utilisé par un autre étudiant ou garant.',
        ]);

        $action->execute($request, $creditRequest);

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

        $user = auth()->user();
        $canViewContract = $user->can('viewContract', $creditRequest);

        $filteredMedia = $creditRequest->media->filter(function ($media) use ($canViewContract) {
            $type = $media->getCustomProperty('type');

            if ($type === 'loan_contract' && ! $canViewContract) {
                return false;
            }

            $media->setAttribute('original_url', $media->getTemporaryUrl(now()->addMinutes(60)));

            return true;
        })->values();

        $activities = $creditRequest->activities()
            ->with('user')
            ->paginate(10, ['*'], 'activities_page')
            ->withQueryString();

        return Inertia::render('credit/show', [
            'creditRequest' => array_merge($creditRequest->toArray(), [
                'is_complete' => $creditRequest->isComplete(),
                'missing_documents' => $creditRequest->getMissingDocuments(),
                'required_document_types' => CreditRequest::getRequiredDocumentTypes(),
                'media' => $filteredMedia,
                'activities' => Inertia::merge(fn () => $activities),
                'can_regenerate_contract' => $user->can('regenerateContract', $creditRequest),
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

    public function submit(CreditRequest $creditRequest, SubmitCreditRequest $action): RedirectResponse
    {
        if ($creditRequest->status !== CreditRequestStatus::CREATION) {
            return back()->with('error', "Le dossier n'est pas dans un état permettant la soumission.");
        }

        $action->execute($creditRequest);

        return back()->with('success', 'Dossier soumis avec succès.');
    }

    public function validateRequest(CreditRequest $creditRequest, ValidateCreditRequest $action): RedirectResponse
    {
        if ($creditRequest->status !== CreditRequestStatus::SOUMIS) {
            return back()->with('error', "Le dossier n'est pas dans un état permettant la validation.");
        }

        // Vérifier si tous les documents sont présents (Exception pour Admin et Super Admin)
        $isAdmin = auth()->user()->hasAnyRole(['Administrateur', 'Super admin']);

        if (! $creditRequest->isComplete() && ! $isAdmin) {
            return back()->with('error', 'Le dossier est incomplet. Veuillez vérifier que tous les documents requis sont présents.');
        }

        $action->execute($creditRequest);

        return back()->with('success', 'Dossier validé avec succès.');
    }

    public function rejectRequest(Request $request, CreditRequest $creditRequest, RejectCreditRequest $action): RedirectResponse
    {
        if ($creditRequest->status !== CreditRequestStatus::SOUMIS) {
            return back()->with('error', "Le dossier n'est pas dans un état permettant le rejet.");
        }

        $action->execute($creditRequest, $request->input('reason'));

        return back()->with('success', 'Dossier rejeté avec succès.');
    }

    public function resiliate(CreditRequest $creditRequest, ResiliateCreditRequest $action): RedirectResponse
    {
        $action->execute($creditRequest);

        return back()->with('success', 'Dossier résilié avec succès.');
    }

    public function cloturer(CreditRequest $creditRequest, CloseCreditRequest $action): RedirectResponse
    {
        $action->execute($creditRequest);

        return back()->with('success', 'Dossier clôturé avec succès.');
    }

    public function regenerateDocument(Request $request, CreditRequest $creditRequest): RedirectResponse
    {
        $this->authorize('regenerateContract', $creditRequest);

        // Supprime l'ancien contrat s'il existe
        $existing = $creditRequest->media()
            ->where('custom_properties->type', 'loan_contract')
            ->first();

        if ($existing) {
            $existing->delete();
        }

        $creditRequest->loadMissing(['student', 'creditType']);

        $creditRequest->generateDocument(
            'loan_contract.docx',
            'contrat_de_pret_'.strtolower($creditRequest->code).'.pdf',
            [
                'type' => 'loan_contract',
                'user_id' => auth()->id(),
            ]
        );

        return back()->with('success', 'Le contrat est en cours de régénération.');
    }

    public function destroy(CreditRequest $creditRequest)
    {
        $creditRequest->delete();

        return redirect()->route('credit.index')->with('success', 'Dossier supprimé avec succès.');
    }

    public function uploadDocument(Request $request, CreditRequest $creditRequest)
    {
        Gate::authorize('update', $creditRequest);

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

    public function recordRepayment(Request $request, CreditRequest $creditRequest, CreditRequestInstallment $installment, RecordRepayment $action): RedirectResponse
    {
        $request->validate([
            'amount' => 'required|numeric|min:0',
            'repayment_date' => 'required|date',
            'payment_method' => 'required|string',
            'reference' => 'nullable|string',
            'notes' => 'nullable|string',
            'proof' => 'required|file|max:10240',
        ]);

        $action->execute($request, $creditRequest, $installment);

        return back()->with('success', 'Remboursement soumis avec succès. Il sera validé après vérification de la preuve.');
    }

    public function validateRepayment(CreditRequest $creditRequest, CreditRequestRepayment $repayment, ValidateRepayment $action): RedirectResponse
    {
        if ($repayment->status === 'validated') {
            return back()->with('error', 'Ce remboursement est déjà validé.');
        }

        $action->execute($creditRequest, $repayment);

        return back()->with('success', 'Remboursement validé avec succès.');
    }

    public function rejectRepayment(Request $request, CreditRequest $creditRequest, CreditRequestRepayment $repayment, RejectRepayment $action): RedirectResponse
    {
        $request->validate([
            'reason' => 'required|string|max:255',
        ]);

        if ($repayment->status === 'validated') {
            return back()->with('error', 'Un remboursement validé ne peut pas être rejeté.');
        }

        $action->execute($creditRequest, $repayment, $request->reason);

        return back()->with('success', 'Remboursement rejeté.');
    }
}

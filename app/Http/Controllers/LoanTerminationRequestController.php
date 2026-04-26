<?php

namespace App\Http\Controllers;

use App\Models\CreditRequest;
use App\Models\LoanTerminationRequest;
use App\Models\User;
use App\Notifications\LoanTerminationProcessedNotification;
use App\Notifications\LoanTerminationRequestedNotification;
use App\Enums\CreditRequestStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;

class LoanTerminationRequestController extends Controller
{
    public function index()
    {
        $requests = LoanTerminationRequest::with(['creditRequest.student', 'user'])
            ->latest()
            ->paginate(10);

        return Inertia::render('credit/termination/index', [
            'requests' => $requests,
            'breadcrumbs' => [
                ['title' => 'Crédit', 'href' => route('credit.index')],
                ['title' => 'Résiliations', 'href' => '#'],
            ],
        ]);
    }

    public function create(CreditRequest $creditRequest)
    {
        $creditRequest->load('student');

        return Inertia::render('credit/termination/create', [
            'creditRequest' => $creditRequest,
            'breadcrumbs' => [
                ['title' => 'Crédit', 'href' => route('credit.index')],
                ['title' => $creditRequest->code, 'href' => route('credit.show', $creditRequest)],
                ['title' => 'Demande de résiliation', 'href' => '#'],
            ],
        ]);
    }

    public function store(Request $request, CreditRequest $creditRequest)
    {
        $validated = $request->validate([
            'requested_date' => 'required|date',
            'reason' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $terminationRequest = $creditRequest->terminationRequests()->create([
            'user_id' => auth()->id(),
            'requested_date' => $validated['requested_date'],
            'reason' => $validated['reason'],
            'description' => $validated['description'],
            'status' => 'pending',
        ]);

        // Envoyer les notifications
        $this->notifyStakeholders($terminationRequest);

        return redirect()->route('credit.show', $creditRequest)
            ->with('success', 'Votre demande de résiliation a été soumise avec succès.');
    }

    public function show(LoanTerminationRequest $loanTerminationRequest)
    {
        $loanTerminationRequest->load(['creditRequest.student', 'user', 'processedBy']);

        return Inertia::render('credit/termination/show', [
            'terminationRequest' => $loanTerminationRequest,
            'breadcrumbs' => [
                ['title' => 'Crédit', 'href' => route('credit.index')],
                ['title' => 'Résiliations', 'href' => route('credit.termination-requests.index')],
                ['title' => $loanTerminationRequest->creditRequest->code, 'href' => '#'],
            ],
        ]);
    }

    public function approve(Request $request, LoanTerminationRequest $loanTerminationRequest)
    {
        $loanTerminationRequest->update([
            'status' => 'approved',
            'processed_by_id' => auth()->id(),
            'processed_at' => now(),
        ]);

        // Mettre à jour le statut du crédit en "rejeter" comme demandé par l'utilisateur
        $loanTerminationRequest->creditRequest->update([
            'status' => CreditRequestStatus::REJETER,
            'rejected_at' => now(),
            'rejected_by_id' => auth()->id(),
            'rejection_reason' => "Résiliation approuvée : " . $loanTerminationRequest->reason,
        ]);

        // Clôturer (annuler) toutes les mensualités en attente liées à ce dossier
        $loanTerminationRequest->creditRequest->installments()
            ->where('status', 'pending')
            ->update(['status' => 'cancelled']);

        // Envoyer les notifications
        $this->notifyStakeholders($loanTerminationRequest);

        return redirect()->back()->with('success', 'La demande de résiliation a été approuvée et le dossier a été rejeté.');
    }

    public function reject(Request $request, LoanTerminationRequest $loanTerminationRequest)
    {
        $validated = $request->validate([
            'rejection_reason' => 'required|string',
        ]);

        $loanTerminationRequest->update([
            'status' => 'rejected',
            'processed_by_id' => auth()->id(),
            'processed_at' => now(),
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        // Envoyer les notifications
        $this->notifyStakeholders($loanTerminationRequest);

        return redirect()->back()->with('success', 'La demande de résiliation a été rejetée.');
    }

    protected function notifyStakeholders(LoanTerminationRequest $request)
    {
        $countryId = $request->creditRequest->country_id;

        // Si la demande vient d'être créée (status pending)
        if ($request->status === 'pending') {
            $notification = new LoanTerminationRequestedNotification($request);
        } else {
            // Si elle a été traitée (approved/rejected)
            $notification = new LoanTerminationProcessedNotification($request);
        }

        // Destinataires : L'utilisateur qui a fait la demande (toujours notifié si traitée, ou si c'est lui qui l'a créée c'est optionnel mais ici on notifie les admins)
        $recipients = collect();
        if ($request->status !== 'pending') {
            $recipients->push($request->user);
        }

        // Ajouter les administrateurs et super administrateurs
        $admins = User::role(['Super admin', 'Administrateur'])->get();
        $recipients = $recipients->concat($admins);

        // Ajouter les contrôleurs du pays lié au dossier
        $controllers = User::role('Controlleur (Dossier)')
            ->whereHas('countries', function ($query) use ($countryId) {
                $query->where('countries.id', $countryId);
            })
            ->get();

        $recipients = $recipients->concat($controllers)->unique('id');

        if ($recipients->isNotEmpty()) {
            Notification::send($recipients, $notification);
        }
    }
}

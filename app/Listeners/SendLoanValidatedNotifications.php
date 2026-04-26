<?php

namespace App\Listeners;

use App\Events\LoanValidated;
use App\Models\User;
use App\Notifications\LoanValidatedNotification;
use Illuminate\Support\Facades\Notification;

class SendLoanValidatedNotifications
{
    /**
     * Handle the event.
     */
    public function handle(LoanValidated $event): void
    {
        $creditRequest = $event->creditRequest;

        // Destinataires : Admin, Super admin, Controleur (Dossier) liés au pays, et l'agent (créateur)
        $admins = User::role(['Administrateur', 'Super admin'])->get();

        $controllers = User::role('Controlleur (Dossier)')
            ->whereHas('countries', function ($query) use ($creditRequest) {
                $query->where('countries.id', $creditRequest->country_id);
            })
            ->get();

        $creator = $creditRequest->creator;

        $recipients = $admins->concat($controllers)->push($creator)->filter()->unique('id');

        Notification::send($recipients, new LoanValidatedNotification($creditRequest));
    }
}

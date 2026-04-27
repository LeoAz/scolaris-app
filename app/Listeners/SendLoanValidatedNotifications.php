<?php

namespace App\Listeners;

use App\Events\LoanValidated;
use App\Notifications\LoanValidatedNotification;
use App\Traits\NotifiesStakeholders;
use Illuminate\Support\Facades\Notification;

class SendLoanValidatedNotifications
{
    use NotifiesStakeholders;

    /**
     * Handle the event.
     */
    public function handle(LoanValidated $event): void
    {
        $creditRequest = $event->creditRequest;

        // Destinataires : Admin, Super admin, Controleur (Dossier), Validateur liés au pays, et l'agent (créateur)
        $recipients = $this->getStakeholders($creditRequest->country_id)
            ->push($creditRequest->creator)
            ->filter()
            ->unique('id');

        Notification::send($recipients, new LoanValidatedNotification($creditRequest));
    }
}

<?php

namespace App\Actions\Credit;

use App\Enums\CreditRequestStatus;
use App\Models\CreditRequest;
use App\Notifications\CreditRequestSubmitted;
use App\Traits\NotifiesStakeholders;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class SubmitCreditRequest
{
    use NotifiesStakeholders;

    public function execute(CreditRequest $creditRequest): void
    {
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
            Log::info('Notifications de soumission envoyées à '.$recipients->count().' destinataires.');
        } else {
            Log::warning('Aucun destinataire trouvé pour la notification de soumission du dossier '.$creditRequest->code);
        }

        // Notifier aussi le créateur du dossier via l'application
        $creditRequest->creator->notify(new CreditRequestSubmitted($creditRequest));
        Log::info('Notification de soumission envoyée au créateur: '.$creditRequest->creator->email);
    }
}

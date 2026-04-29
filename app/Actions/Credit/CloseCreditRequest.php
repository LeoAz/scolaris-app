<?php

namespace App\Actions\Credit;

use App\Enums\CreditRequestStatus;
use App\Models\CreditRequest;
use App\Notifications\LoanClosedNotification;
use App\Traits\NotifiesStakeholders;
use Illuminate\Support\Facades\Notification;

class CloseCreditRequest
{
    use NotifiesStakeholders;

    public function execute(CreditRequest $creditRequest): void
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
    }
}

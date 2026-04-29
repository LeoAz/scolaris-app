<?php

namespace App\Actions\Credit;

use App\Enums\CreditRequestStatus;
use App\Models\CreditRequest;
use App\Notifications\CreditRequestRejected;
use App\Traits\NotifiesStakeholders;
use Illuminate\Support\Facades\Notification; // Note: In controller it pushes creator and notifies stakeholders

class ResiliateCreditRequest
{
    use NotifiesStakeholders;

    public function execute(CreditRequest $creditRequest): void
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

        Notification::send($recipients, new CreditRequestRejected($creditRequest, 'Résiliation du dossier'));
    }
}

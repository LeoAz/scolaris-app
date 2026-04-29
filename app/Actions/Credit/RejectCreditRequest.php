<?php

namespace App\Actions\Credit;

use App\Enums\CreditRequestStatus;
use App\Models\CreditRequest;
use App\Notifications\CreditRequestRejected;
use App\Traits\NotifiesStakeholders;
use Illuminate\Support\Facades\Notification;

class RejectCreditRequest
{
    use NotifiesStakeholders;

    public function execute(CreditRequest $creditRequest, ?string $reason): void
    {
        $creditRequest->update([
            'status' => CreditRequestStatus::REJETER->value,
            'rejected_at' => now(),
            'rejected_by_id' => auth()->id(),
            'rejection_reason' => $reason,
        ]);

        $creditRequest->activities()->create([
            'user_id' => auth()->id(),
            'action' => 'rejection',
            'description' => 'Le dossier a été rejeté. Motif : '.($reason ?? 'Non spécifié'),
        ]);

        // Destinataires : Admin, Super admin, Controleur (Dossier), Validateurs liés au pays, et le créateur
        $recipients = $this->getStakeholders($creditRequest->country_id)
            ->push($creditRequest->creator)
            ->filter()
            ->unique('id');

        Notification::send($recipients, new CreditRequestRejected($creditRequest, $reason));
    }
}

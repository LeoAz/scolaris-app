<?php

namespace App\Actions\Credit;

use App\Enums\CreditRequestStatus;
use App\Events\LoanValidated;
use App\Models\CreditRequest;

class ValidateCreditRequest
{
    public function execute(CreditRequest $creditRequest): void
    {
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

        // Passe auth()->id() explicitement pour la queue
        LoanValidated::dispatch($creditRequest, auth()->id());
    }
}

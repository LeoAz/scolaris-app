<?php

namespace App\Listeners;

use App\Events\LoanValidated;
use Illuminate\Contracts\Queue\ShouldQueue;

class GenerateLoanContractListener implements ShouldQueue
{
    public function handle(LoanValidated $event): void
    {
        $creditRequest = $event->creditRequest;

        $creditRequest->loadMissing(['student', 'creditType']);

        $creditRequest->generateDocument(
            'loan_contract.docx',
            'contrat_de_pret_'.strtolower($creditRequest->code).'.pdf',
            [
                'type' => 'loan_contract',
                'user_id' => $event->userId,
            ]
        );
    }
}

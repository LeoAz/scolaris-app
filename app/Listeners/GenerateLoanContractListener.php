<?php

namespace App\Listeners;

use App\Events\LoanValidated;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class GenerateLoanContractListener implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(LoanValidated $event): void
    {
        $creditRequest = $event->creditRequest;

        $creditRequest->generateDocument(
            'loan_contract.docx',
            'contrat_de_pret_'.strtolower($creditRequest->code).'.pdf',
            [
                'type' => 'loan_contract',
                'user_id' => auth()->id(),
            ]
        );
    }
}

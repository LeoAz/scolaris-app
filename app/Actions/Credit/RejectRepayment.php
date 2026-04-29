<?php

namespace App\Actions\Credit;

use App\Models\CreditRequest;
use App\Models\CreditRequestRepayment;
use Illuminate\Support\Facades\DB;

class RejectRepayment
{
    public function execute(CreditRequest $creditRequest, CreditRequestRepayment $repayment, string $reason): void
    {
        DB::transaction(function () use ($creditRequest, $repayment, $reason) {
            $repayment->update([
                'status' => 'rejected',
                'notes' => $repayment->notes."\n\nMotif du rejet : ".$reason,
            ]);

            $creditRequest->activities()->create([
                'user_id' => auth()->id(),
                'action' => 'repayment_rejection',
                'description' => "Rejet du remboursement de {$repayment->amount} pour l'échéance n°{$repayment->installment->installment_number}.",
                'properties' => [
                    'installment_id' => $repayment->installment_id,
                    'amount' => $repayment->amount,
                    'repayment_id' => $repayment->id,
                    'reason' => $reason,
                ],
            ]);
        });
    }
}

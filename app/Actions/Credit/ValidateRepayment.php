<?php

namespace App\Actions\Credit;

use App\Models\CreditRequest;
use App\Models\CreditRequestRepayment;
use Illuminate\Support\Facades\DB;

class ValidateRepayment
{
    public function execute(CreditRequest $creditRequest, CreditRequestRepayment $repayment): void
    {
        DB::transaction(function () use ($creditRequest, $repayment) {
            $repayment->update([
                'status' => 'validated',
                'validated_at' => now(),
                'validated_by_id' => auth()->id(),
            ]);

            // Mise à jour du statut de l'échéance si le montant total validé est payé
            $installment = $repayment->installment;
            $totalValidatedPaid = $installment->repayments()
                ->where('status', 'validated')
                ->sum('amount');

            if ($totalValidatedPaid >= $installment->total_amount) {
                $installment->update(['status' => 'paid']);
            }

            $creditRequest->activities()->create([
                'user_id' => auth()->id(),
                'action' => 'repayment_validation',
                'description' => "Validation du remboursement de {$repayment->amount} pour l'échéance n°{$installment->installment_number}.",
                'properties' => [
                    'installment_id' => $installment->id,
                    'amount' => $repayment->amount,
                    'repayment_id' => $repayment->id,
                ],
            ]);
        });
    }
}

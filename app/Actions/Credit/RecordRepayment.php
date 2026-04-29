<?php

namespace App\Actions\Credit;

use App\Jobs\UploadRepaymentProof;
use App\Models\CreditRequest;
use App\Models\CreditRequestInstallment;
use App\Models\CreditRequestRepayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RecordRepayment
{
    public function execute(Request $request, CreditRequest $creditRequest, CreditRequestInstallment $installment): CreditRequestRepayment
    {
        return DB::transaction(function () use ($request, $creditRequest, $installment) {
            $repayment = $installment->repayments()->create([
                'credit_request_id' => $creditRequest->id,
                'amount' => $request->amount,
                'repayment_date' => $request->repayment_date,
                'payment_method' => $request->payment_method,
                'reference' => $request->reference,
                'notes' => $request->notes,
                'status' => 'pending',
            ]);

            // Store file temporarily
            $file = $request->file('proof');
            $tempPath = $file->store('temp-proofs', 'local');

            // Dispatch job
            UploadRepaymentProof::dispatch(
                $repayment,
                $tempPath,
                $file->getClientOriginalName(),
                auth()->id()
            );

            $creditRequest->activities()->create([
                'user_id' => auth()->id(),
                'action' => 'repayment_submission',
                'description' => "Soumission d'un remboursement de {$request->amount} pour l'échéance n°{$installment->installment_number}.",
                'properties' => [
                    'installment_id' => $installment->id,
                    'amount' => $request->amount,
                    'repayment_id' => $repayment->id,
                ],
            ]);

            return $repayment;
        });
    }
}

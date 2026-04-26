<?php

namespace App\Jobs;

use App\Models\CreditRequestRepayment;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;

class UploadRepaymentProof implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public CreditRequestRepayment $repayment,
        public string $tempPath,
        public string $originalName,
        public int $userId
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        if (! Storage::disk('local')->exists($this->tempPath)) {
            return;
        }

        $fullPath = Storage::disk('local')->path($this->tempPath);

        $this->repayment->addMedia($fullPath)
            ->usingFileName($this->originalName)
            ->toMediaCollection('proofs');

        $this->repayment->creditRequest->activities()->create([
            'user_id' => $this->userId,
            'action' => 'repayment_proof_upload',
            'description' => "Ajout d'une preuve de remboursement pour l'échéance n°{$this->repayment->installment->installment_number} (via queue).",
            'properties' => [
                'repayment_id' => $this->repayment->id,
                'filename' => $this->originalName,
            ],
        ]);

        // Cleanup temporary file
        Storage::disk('local')->delete($this->tempPath);
    }
}

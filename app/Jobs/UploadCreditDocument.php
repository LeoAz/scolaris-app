<?php

namespace App\Jobs;

use App\Models\CreditRequest;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;

class UploadCreditDocument implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public CreditRequest $creditRequest,
        public string $tempPath,
        public string $originalName,
        public string $type,
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
        $label = CreditRequest::getRequiredDocumentTypes()[$this->type] ?? $this->type;

        $this->creditRequest->addMedia($fullPath)
            ->usingFileName($this->originalName)
            ->withCustomProperties(['type' => $this->type])
            ->toMediaCollection('documents');

        $this->creditRequest->activities()->create([
            'user_id' => $this->userId,
            'action' => 'document_upload',
            'description' => "Ajout du document : {$label} (via queue)",
            'properties' => [
                'type' => $this->type,
                'filename' => $this->originalName,
            ],
        ]);

        // Cleanup temporary file
        Storage::disk('local')->delete($this->tempPath);
    }
}

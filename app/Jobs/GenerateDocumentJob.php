<?php

namespace App\Jobs;

use App\Models\CreditRequest;
use App\Services\DocumentGeneratorService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\File;
use Spatie\MediaLibrary\HasMedia;

class GenerateDocumentJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        protected string $templateName,
        protected Model&HasMedia $model,
        protected string $fileName,
        protected array $extraData = []
    ) {}

    public function handle(DocumentGeneratorService $generator): void
    {
        $tempPdf = $generator->generatePdfFromDocx(
            $this->templateName,
            $this->model,
            $this->extraData
        );

        $media = $this->model->addMedia($tempPdf)
            ->usingFileName($this->fileName)
            ->withCustomProperties([
                'type' => $this->extraData['type'] ?? 'generated_document',
                'is_generated' => true,
            ])
            ->toMediaCollection($this->extraData['collection'] ?? 'documents');

        if ($this->model instanceof CreditRequest) {
            $label = CreditRequest::getRequiredDocumentTypes()[$this->extraData['type'] ?? ''] ?? 'Document généré';

            $this->model->activities()->create([
                'user_id' => $this->extraData['user_id'] ?? null,
                'action' => 'document_generation',
                'description' => "Génération du document : {$label}",
                'properties' => [
                    'type' => $this->extraData['type'] ?? 'generated_document',
                    'filename' => $this->fileName,
                ],
            ]);
        }

        if (File::exists($tempPdf)) {
            File::delete($tempPdf);
        }
    }
}

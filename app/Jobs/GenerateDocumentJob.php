<?php

namespace App\Jobs;

use App\Services\DocumentGeneratorService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\File;
use Spatie\MediaLibrary\HasMedia;

class GenerateDocumentJob implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(
        protected string $templateName,
        protected Model&HasMedia $model,
        protected string $fileName,
        protected array $extraData = []
    ) {
    }

    /**
     * Execute the job.
     */
    public function handle(DocumentGeneratorService $generator): void
    {
        $tempPdf = $generator->generatePdfFromDocx(
            $this->templateName,
            $this->model,
            $this->extraData
        );

        // Attacher le fichier au modèle via MediaLibrary
        $media = $this->model->addMedia($tempPdf)
            ->usingFileName($this->fileName)
            ->withCustomProperties([
                'type' => $this->extraData['type'] ?? 'generated_document',
                'is_generated' => true,
            ])
            ->toMediaCollection($this->extraData['collection'] ?? 'documents');

        // Ajouter une activité si c'est un CreditRequest
        if ($this->model instanceof \App\Models\CreditRequest) {
            $label = \App\Models\CreditRequest::getRequiredDocumentTypes()[$this->extraData['type'] ?? ''] ?? 'Document généré';
            $this->model->activities()->create([
                'user_id' => $this->extraData['user_id'] ?? null,
                'action' => 'document_generation',
                'description' => "Génération automatique du document : {$label}",
                'properties' => [
                    'type' => $this->extraData['type'] ?? 'generated_document',
                    'filename' => $this->fileName,
                ],
            ]);
        }

        // Nettoyer le fichier temporaire
        if (File::exists($tempPdf)) {
            File::delete($tempPdf);
        }
    }
}

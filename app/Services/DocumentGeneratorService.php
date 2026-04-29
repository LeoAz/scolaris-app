<?php

namespace App\Services;

use App\Models\CreditRequest;
use Exception;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;
use PhpOffice\PhpWord\TemplateProcessor;

class DocumentGeneratorService
{
    /**
     * Génère un document PDF à partir d'un template Word.
     */
    public function generatePdfFromDocx(string $templateName, Model $model, array $extraData = []): string
    {
        $templatePath = app_path('templates/'.$templateName);

        if (! File::exists($templatePath)) {
            throw new Exception("Template not found: {$templatePath}");
        }
        $templateProcessor = new TemplateProcessor($templatePath);

        $data = $this->prepareData($model, $extraData);

        foreach ($data as $key => $value) {
            $templateProcessor->setValue($key, (string) $value);
        }

        $tempDir = sys_get_temp_dir();
        $tempDocx = $tempDir.DIRECTORY_SEPARATOR.uniqid('doc_', true).'.docx';
        $templateProcessor->saveAs($tempDocx);

        // 5. Convertir Word en PDF en utilisant LibreOffice
        $outputDir = $tempDir;
        $libreOfficePath = config('app.libreoffice_path', '/usr/bin/soffice');
        $result = Process::env([
            'HOME' => $tempDir,
        ])->run([
            $libreOfficePath,
            '--headless',
            '--convert-to', 'pdf',
            '--outdir', $outputDir,
            $tempDocx,
        ]);

        if (! $result->successful()) {
            @unlink($tempDocx);
            throw new Exception('LibreOffice conversion failed: '.$result->errorOutput());
        }

        // Le fichier de sortie aura le même nom que le fichier d'entrée mais avec l'extension .pdf
        $tempPdf = str_replace('.docx', '.pdf', $tempDocx);

        if (! File::exists($tempPdf)) {
            @unlink($tempDocx);
            throw new Exception('PDF file was not created by LibreOffice.');
        }

        @unlink($tempDocx);

        return $tempPdf;
    }

    /**
     * Prépare les données à partir du modèle.
     */
    protected function prepareData(Model $model, array $extraData): array
    {
        $data = $model->toArray();

        if ($model instanceof CreditRequest) {
            $data['current_date'] = now()->format('d/m/Y');

            if ($model->student) {
                $data['student_name'] = $model->student->full_name;
                $data['student_address'] = $model->student->address ?? '';
            }

            $data['loan_amount'] = number_format($model->amount_requested, 0, ',', ' ').' FCFA';

            if ($model->creditType) {
                $data['interest_rate'] = number_format($model->creditType->rate, 2, ',', ' ').' %';
                $data['loan_duration'] = $model->creditType->duration_months.' mois';
            }

            $data['payment_frequency'] = 'Mensuelle';

            // Log des données pour débogage
            // \Illuminate\Support\Facades\Log::info('Document data:', $data);
        }

        if (isset($data['amount_requested']) && ! isset($data['amount_formatted'])) {
            $data['amount_formatted'] = number_format($data['amount_requested'], 0, ',', ' ').' FCFA';
        }

        return array_merge($data, $extraData);
    }
}

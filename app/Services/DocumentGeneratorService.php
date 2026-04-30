<?php

namespace App\Services;

use App\Models\CreditRequest;
use Exception;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;

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

        // On crée un fichier temporaire pour manipuler le XML directement si nécessaire
        $tempDir = sys_get_temp_dir();
        $tempDocx = $tempDir.DIRECTORY_SEPARATOR.uniqid('doc_', true).'.docx';
        File::copy($templatePath, $tempDocx);

        $this->processMergeFields($tempDocx, $model, $extraData);

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
     * Traite les MERGEFIELD dans le document Word.
     */
    protected function processMergeFields(string $docxPath, Model $model, array $extraData): void
    {
        $data = $this->prepareData($model, $extraData);

        $zip = new \ZipArchive;
        if ($zip->open($docxPath) === true) {
            $xmlContent = $zip->getFromName('word/document.xml');

            // Nettoyage global de la fragmentation Word pour les MERGEFIELD
            for ($i = 0; $i < 25; $i++) {
                $old = $xmlContent;
                // Fusion de deux tags instrText consécutifs dans un MERGEFIELD
                $xmlContent = preg_replace_callback('/(<w:instrText[^>]*>[^<]*MERGEFIELD\s+[^<]*)<\/w:instrText>(?:<\/w:r><w:r[^>]*>)?<w:instrText[^>]*>([^<]*)<\/w:instrText>/si', function ($m) {
                    if (str_contains($m[2], 'MERGEFIELD')) {
                        return $m[0];
                    }
                    if (isset($m[2][0]) && $m[2][0] === '<') {
                        return $m[0];
                    }

                    return $m[1].$m[2].'</w:instrText>';
                }, $xmlContent);
                if ($old === $xmlContent) {
                    break;
                }
            }

            foreach ($data as $key => $value) {
                if (is_array($value)) {
                    continue;
                }

                $keyEscaped = preg_quote($key, '/');
                $valStr = (string) $value;

                // 1. Remplacement simple du texte «key» (cas le plus simple et fiable)
                $xmlContent = str_replace('«'.$key.'»', $valStr, $xmlContent);

                // 2. Remplacement des MERGEFIELD Word
                // On boucle pour remplacer TOUTES les occurrences de cette variable dans le XML
                // Word peut avoir plusieurs fois le même champ de fusion.
                for ($k = 0; $k < 5; $k++) {
                    $oldLoopXml = $xmlContent;

                    // Tentative avec séparateur
                    $xmlContent = preg_replace_callback('/(<w:instrText[^>]*>[^<]*MERGEFIELD\s+[^<]*?=?'.$keyEscaped.'\b.*?<w:fldChar w:fldCharType="separate"\/>.*?<w:t[^>]*>)([^<]*)(<\/w:t>)/si', function ($m) use ($valStr) {
                        return $m[1].$valStr.$m[3];
                    }, $xmlContent);

                    // Fallback sans séparateur
                    $xmlContent = preg_replace_callback('/(<w:instrText[^>]*>[^<]*MERGEFIELD\s+[^<]*?=?'.$keyEscaped.'\b.*?<w:t[^>]*>)([^<]*)(<\/w:t>)/si', function ($m) use ($valStr) {
                        return $m[1].$valStr.$m[3];
                    }, $xmlContent);

                    if ($oldLoopXml === $xmlContent) {
                        break;
                    }
                }
            }

            $zip->addFromString('word/document.xml', $xmlContent);
            $zip->close();
        }
    }

    /**
     * Prépare les données à partir du modèle.
     */
    protected function prepareData(Model $model, array $extraData): array
    {
        $data = $model->toArray();

        // On ne garde que les valeurs scalaires du modèle pour éviter les erreurs de conversion
        $data = array_filter($data, fn ($value) => is_scalar($value) || $value === null);

        if ($model instanceof CreditRequest) {
            $data['current_date'] = now()->format('d/m/Y');

            if ($model->student) {
                $data['student_name'] = $model->student->full_name;
                $data['student_address'] = $model->student->address ?? '';
            }

            if ($model->guarantor) {
                $data['guarantor_name'] = $model->guarantor->full_name;
                $data['guarantor_address'] = $model->guarantor->address ?? '';
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

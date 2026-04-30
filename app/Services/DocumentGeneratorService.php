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

            foreach ($data as $key => $value) {
                if (is_array($value)) {
                    continue;
                }

                $xmlContent = str_replace('«'.$key.'»', (string) $value, $xmlContent);

                // On remplace aussi les placeholders sans les chevrons (ex: guarantor_name)
                $xmlContent = str_replace($key, (string) $value, $xmlContent);

                // On remplace aussi les instructions de champ pour éviter que Word ne remette «key» à l'ouverture
                // On cherche le début d'un MERGEFIELD et on s'assure de remplacer la valeur textuelle associée (<w:t>)
                // On gère les espaces éventuels autour du nom de la variable (ex: MERGEFIELD = guarantor_name)
                $xmlContent = preg_replace('/(MERGEFIELD\s+(=)?\s*'.$key.'\s*.*?<w:t[^>]*>)[^<]*(<\/w:t>)/s', '$1'.(string) $value.'$3', $xmlContent);

                // Si le nom de la variable contient des espaces dans le MERGEFIELD lui-même (ex: MERGEFIELD guarantor_name )
                $xmlContent = preg_replace('/(MERGEFIELD\s+(=)?\s*'.$key.'\s+.*?<w:t[^>]*>)[^<]*(<\/w:t>)/s', '$1'.(string) $value.'$3', $xmlContent);

                // On remplace aussi spécifiquement les occurrences avec des espaces autour du nom dans les instructions MERGEFIELD
                // Cela aide à capturer MERGEFIELD  =guarantor_name
                $xmlContent = preg_replace('/MERGEFIELD\s+(=)?\s+'.$key.'\s+/', 'MERGEFIELD ='.(string) $value.' ', $xmlContent);
                $xmlContent = preg_replace('/MERGEFIELD\s+=\s*'.$key.'\s+/', 'MERGEFIELD ='.(string) $value.' ', $xmlContent);
                $xmlContent = preg_replace('/MERGEFIELD\s+'.$key.'\s+/', 'MERGEFIELD ='.(string) $value.' ', $xmlContent);

                // On force aussi le remplacement dans l'instruction MERGEFIELD elle-même pour l'affichage cohérent dans Word
                $xmlContent = preg_replace('/MERGEFIELD\s+(=)?\s*'.$key.'(\s+|$)/', 'MERGEFIELD ='.(string) $value.' ', $xmlContent);
                // On gère les espaces variables dans MERGEFIELD = guarantor_name
                $xmlContent = preg_replace('/MERGEFIELD\s+=\s*'.$key.'/', 'MERGEFIELD ='.(string) $value, $xmlContent);
                // Cas spécifique MERGEFIELD  =guarantor_name
                $xmlContent = preg_replace('/MERGEFIELD\s+=\s*'.$key.'/', 'MERGEFIELD ='.(string) $value, $xmlContent);
                // Remplacement global pour tout MERGEFIELD contenant la clé, peu importe les espaces
                $xmlContent = preg_replace('/MERGEFIELD\s+(=)?\s*'.$key.'\s+/', 'MERGEFIELD ='.(string) $value.' ', $xmlContent);
                // Tentative brute sur le nom avec n'importe quel nombre d'espaces avant/après
                $xmlContent = str_replace(' '.$key.' ', ' '.(string) $value.' ', $xmlContent);
                $xmlContent = str_replace('='.$key.' ', '='.(string) $value.' ', $xmlContent);
                $xmlContent = str_replace(' '.$key.'*', ' '.(string) $value.'*', $xmlContent);
                $xmlContent = str_replace(' '.$key, ' '.(string) $value, $xmlContent);
                $xmlContent = str_replace('='.$key, '='.(string) $value, $xmlContent);
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

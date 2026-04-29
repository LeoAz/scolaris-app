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
     *
     * @param  string  $templateName  Nom du fichier template dans app/templates (ex: 'contract.docx')
     * @param  Model  $model  Le modèle contenant les données pour le remplacement
     * @param  array  $extraData  Données supplémentaires optionnelles
     * @return string Chemin vers le fichier PDF temporaire généré
     *
     * @throws Exception
     */
    public function generatePdfFromDocx(string $templateName, Model $model, array $extraData = []): string
    {
        $templatePath = app_path('templates/'.$templateName);

        if (! File::exists($templatePath)) {
            throw new Exception("Template not found: {$templatePath}");
        }

        // 1. Préparer le processeur de template
        $templateProcessor = new TemplateProcessor($templatePath);

        // 2. Extraire les données du modèle
        $data = $this->prepareData($model, $extraData);

        // 3. Remplacer les variables dans le document Word
        foreach ($data as $key => $value) {
            // S'assurer que la valeur est une chaîne de caractères
            $templateProcessor->setValue($key, (string) $value);
        }

        // 4. Enregistrer le document Word temporaire
        $tempDir = sys_get_temp_dir();
        $tempDocx = $tempDir.DIRECTORY_SEPARATOR.uniqid('doc_', true).'.docx';
        $templateProcessor->saveAs($tempDocx);

        // 5. Convertir Word en PDF en utilisant LibreOffice (soffice)
        $outputDir = $tempDir;
        $libreOfficePath = config('app.libreoffice_path', 'soffice');

        $result = Process::run([
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

        // Nettoyage du fichier DOCX temporaire (le PDF sera nettoyé par le Job)
        @unlink($tempDocx);

        return $tempPdf;
    }

    /**
     * Prépare les données à partir du modèle.
     * Peut être étendu pour inclure des relations ou des formats spécifiques.
     */
    protected function prepareData(Model $model, array $extraData): array
    {
        $data = $model->toArray();

        // Ajout des données spécifiques pour le contrat de prêt (CreditRequest)
        if ($model instanceof CreditRequest) {
            $data['Date'] = now()->format('d/m/Y');

            if ($model->student) {
                $data['student_name'] = $model->student->full_name;
                $data['student_address'] = $model->student->address ?? '';
            }

            $data['loan_amount'] = number_format($model->amount_requested, 0, ',', ' ').' FCFA';

            if ($model->creditType) {
                $data['interest_rate'] = number_format($model->creditType->rate, 2, ',', ' ').' %';
                $data['loan_duration'] = $model->creditType->duration_months.' mois';
            }

            // Fréquence de paiement (par défaut mensuel)
            $data['payment_frequency'] = 'Mensuelle';
        }

        // On garde le support pour amount_formatted au cas où
        if (isset($data['amount_requested']) && ! isset($data['amount_formatted'])) {
            $data['amount_formatted'] = number_format($data['amount_requested'], 0, ',', ' ').' FCFA';
        }

        return array_merge($data, $extraData);
    }
}

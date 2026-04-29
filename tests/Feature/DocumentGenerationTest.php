<?php

use App\Models\CreditRequest;
use App\Models\CreditType;
use App\Models\Stakeholder;
use App\Services\DocumentGeneratorService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;

uses(RefreshDatabase::class);

test('document generator service replaces placeholders in docx', function () {
    // 1. Préparer les données
    $student = Stakeholder::factory()->create([
        'first_name' => 'Jean',
        'last_name' => 'Dupont',
        'address' => '123 Rue de la Paix',
    ]);

    $creditType = CreditType::factory()->create([
        'name' => 'Prêt Étudiant',
        'rate' => 5.5,
        'duration_months' => 12,
    ]);

    $creditRequest = CreditRequest::factory()->create([
        'student_id' => $student->id,
        'credit_type_id' => $creditType->id,
        'amount_requested' => 1000000,
        'code' => 'TEST-001',
    ]);

    $creditRequest->load(['student', 'creditType']);

    $service = new DocumentGeneratorService;

    // 2. Créer un fichier de test temporaire à partir du template
    $templatePath = app_path('templates/loan_contract.docx');
    if (! File::exists($templatePath)) {
        $this->markTestSkipped('Template loan_contract.docx non trouvé.');
    }

    $tempDocx = sys_get_temp_dir().DIRECTORY_SEPARATOR.'test_replacement_'.uniqid().'.docx';
    File::copy($templatePath, $tempDocx);

    // 3. Exécuter le traitement des champs de fusion
    // On utilise la réflexion pour accéder à la méthode protégée si nécessaire,
    // ou on teste via une méthode publique qui l'appelle.
    $reflection = new ReflectionClass($service);
    $method = $reflection->getMethod('processMergeFields');
    $method->setAccessible(true);
    $method->invoke($service, $tempDocx, $creditRequest, []);

    // 4. Vérifier le contenu du XML
    $zip = new ZipArchive;
    expect($zip->open($tempDocx))->toBeTrue();
    $xmlContent = $zip->getFromName('word/document.xml');
    $zip->close();

    // Nettoyage après extraction du XML
    if (File::exists($tempDocx)) {
        File::delete($tempDocx);
    }

    // Assertions sur le contenu XML (sans les tags pour faciliter la vérification)
    $textContent = strip_tags($xmlContent);

    expect($textContent)->toContain('Jean Dupont');
    expect($textContent)->toContain('123 Rue de la Paix');
    expect($textContent)->toContain('1 000 000 FCFA');
    expect($textContent)->toContain('5,50 %');
    expect($textContent)->toContain('12 mois');
    expect($textContent)->toContain(now()->format('d/m/Y'));

    // Vérifier que les placeholders «...» ont disparu ou ont été remplacés
    expect($textContent)->not->toContain('«student_name»');
    expect($textContent)->not->toContain('«loan_amount»');
});

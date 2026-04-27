<?php

use App\Jobs\UploadCreditDocument;
use App\Models\Country;
use App\Models\CreditRequest;
use App\Models\CreditType;
use App\Models\Stakeholder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

test('flux complet d\'upload, consultation et suppression de document sur S3', function () {
    // 1. Préparation de l'environnement
    $user = User::factory()->create();
    $country = Country::factory()->create(['code' => 'FR']);
    $student = Stakeholder::factory()->create(['type' => 'student', 'last_name' => 'Doe', 'first_name' => 'John']);
    $creditType = CreditType::factory()->create();

    $creditRequest = CreditRequest::factory()->create([
        'country_id' => $country->id,
        'student_id' => $student->id,
        'credit_type_id' => $creditType->id,
        'code' => 'TEST_FLOW_'.now()->timestamp,
    ]);

    // 2. Préparation du document
    $content = 'Contenu de test pour S3 '.now()->timestamp;
    $file = UploadedFile::fake()->createWithContent('contract.pdf', $content);
    $tempPath = $file->store('temp-uploads', 'local');

    // 3. Exécution de l'upload via le Job (qui utilise S3 comme configuré dans le modèle)
    $job = new UploadCreditDocument(
        $creditRequest,
        $tempPath,
        'contract.pdf',
        'demande_pret',
        $user->id
    );

    $job->handle();

    // 4. Vérifier la présence sur S3
    $creditRequest->refresh();
    $media = $creditRequest->getFirstMedia('documents');
    expect($media)->not->toBeNull();

    $disk = Storage::disk('s3');
    $pathOnS3 = $media->getPathRelativeToRoot();

    expect($disk->exists($pathOnS3))->toBeTrue('Le document devrait exister sur S3');

    // 5. Vérifier l'accessibilité (URL temporaire)
    $url = $media->getTemporaryUrl(now()->addMinutes(5));
    // dd($url); // Décommenter si besoin de voir l'URL
    expect($url)->toContain('amazonaws.com');
    expect($url)->toContain('contract.pdf');

    // Vérifier que le contenu est accessible
    $response = Http::get($url);
    expect($response->successful())->toBeTrue("L'URL temporaire devrait être accessible");
    expect($response->body())->not->toBeEmpty();

    // 6. Suppression via le contrôleur
    $this->actingAs($user)
        ->delete(route('credit.documents.delete', ['creditRequest' => $creditRequest->id, 'media' => $media->id]))
        ->assertRedirect();

    // 7. Vérifier la suppression sur S3
    expect($disk->exists($pathOnS3))->toBeFalse('Le document devrait être supprimé de S3');

    // Vérifier que le média est supprimé de la DB
    expect($creditRequest->media()->count())->toBe(0);
});

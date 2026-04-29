<?php

use App\Jobs\UploadCreditDocument;
use App\Models\Country;
use App\Models\CreditRequest;
use App\Models\CreditType;
use App\Models\Stakeholder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('local');
    Queue::fake();
});

test('it dispatches an upload job for each document', function () {
    $user = User::factory()->create();
    $role = Role::findOrCreate('Super admin');
    $user->assignRole($role);
    $country = Country::factory()->create(['code' => 'FR']);
    $user->countries()->attach($country);
    $student = Stakeholder::factory()->create(['type' => 'student', 'last_name' => 'Doe', 'first_name' => 'John']);
    $creditType = CreditType::factory()->create();
    $user->creditTypes()->attach($creditType);

    // Ensure the permission exists (middleware CheckRoutePermission needs it)
    Permission::findOrCreate('credit.documents.upload');
    $role->givePermissionTo('credit.documents.upload');

    $creditRequest = CreditRequest::factory()->create([
        'country_id' => $country->id,
        'student_id' => $student->id,
        'credit_type_id' => $creditType->id,
        'created_by_id' => $user->id,
        'code' => 'FR_SCF_202604_000001_doe_john',
        'created_at' => '2026-04-20 15:16:00',
    ]);

    $file1 = UploadedFile::fake()->create('doc1.pdf', 100);
    $file2 = UploadedFile::fake()->create('doc2.pdf', 100);

    $response = $this->actingAs($user)
        ->post("/credit/requests/{$creditRequest->id}/documents", [
            'documents' => [$file1, $file2],
            'types' => ['demande_pret', 'passport_etudiant'],
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('success', 'Documents mis en file d\'attente pour upload.');

    Queue::assertPushed(UploadCreditDocument::class, 2);

    // Check if files are stored in temp directory
    Storage::disk('local')->assertExists('temp-uploads/'.$file1->hashName());
    Storage::disk('local')->assertExists('temp-uploads/'.$file2->hashName());
});

test('job uploads document to correct path', function () {
    $user = User::factory()->create();
    // Role is already created in the same database session because of RefreshDatabase and tests running sequentially?
    // Actually RefreshDatabase refreshes between tests.
    $role = Role::firstOrCreate(['name' => 'Super admin']);
    $user->assignRole($role);
    $country = Country::factory()->create(['code' => 'FR']);
    $user->countries()->attach($country);
    $student = Stakeholder::factory()->create(['type' => 'student', 'last_name' => 'Doe', 'first_name' => 'John']);
    $creditType = CreditType::factory()->create();
    $user->creditTypes()->attach($creditType);

    $creditRequest = CreditRequest::factory()->create([
        'country_id' => $country->id,
        'student_id' => $student->id,
        'credit_type_id' => $creditType->id,
        'created_by_id' => $user->id,
        'code' => 'FR_SCF_202604_000001_doe_john',
        'created_at' => '2026-04-20 15:16:00',
    ]);

    $file = UploadedFile::fake()->create('test.pdf', 100);
    $tempPath = $file->store('temp-uploads', 'local');

    $job = new UploadCreditDocument(
        $creditRequest,
        $tempPath,
        'test.pdf',
        'demande_pret',
        $user->id
    );

    $job->handle();

    $media = $creditRequest->getFirstMedia('documents');
    expect($media)->not->toBeNull();
    expect($media->getCustomProperty('type'))->toBe('demande_pret');

    // Verify path structure: FR/2026/FR_SCF_202604_000001_doe_john/media_id/test.pdf
    $path = $media->getPath();
    expect($path)->toContain('FR/2026/FR_SCF_202604_000001_doe_john/');

    // Verify activity was created
    $this->assertDatabaseHas('credit_request_activities', [
        'credit_request_id' => $creditRequest->id,
        'action' => 'document_upload',
        'user_id' => $user->id,
    ]);

    // Verify temp file was deleted
    Storage::disk('local')->assertMissing($tempPath);
});

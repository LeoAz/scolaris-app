<?php

use App\Models\Country;
use App\Models\CreditRequest;
use App\Models\CreditRequestInstallment;
use App\Models\CreditType;
use App\Models\Stakeholder;
use App\Models\User;
use App\Notifications\RecoveryRecorded;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\Models\Role;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('recording a repayment sends notifications to admins of the same country', function () {
    Notification::fake();

    $country = Country::factory()->create();
    $creditType = CreditType::factory()->create();
    $student = Stakeholder::factory()->create();

    $creditRequest = CreditRequest::factory()->create([
        'country_id' => $country->id,
        'credit_type_id' => $creditType->id,
        'student_id' => $student->id,
    ]);

    $installment = CreditRequestInstallment::create([
        'credit_request_id' => $creditRequest->id,
        'installment_number' => 1,
        'due_date' => now()->addDays(10),
        'principal_amount' => 100000,
        'interest_amount' => 5000,
        'total_amount' => 105000,
        'remaining_principal' => 100000,
        'status' => 'pending',
    ]);

    // Create roles if they don't exist
    foreach (['Administrateur', 'Super admin', 'Controlleur (Dossier)'] as $roleName) {
        Role::findOrCreate($roleName, 'web');
    }
    Role::findOrCreate('Agent', 'web');

    // Admin of same country - should receive notification
    $admin = User::factory()->create();
    $admin->assignRole('Administrateur');
    $admin->countries()->attach($country);

    // Super admin of same country - should receive notification
    $superAdmin = User::factory()->create();
    $superAdmin->assignRole('Super admin');
    $superAdmin->countries()->attach($country);

    // Admin of different country - should NOT receive notification
    $otherCountry = Country::factory()->create();
    $otherAdmin = User::factory()->create();
    $otherAdmin->assignRole('Administrateur');
    $otherAdmin->countries()->attach($otherCountry);

    // Agent of same country - should NOT receive notification
    $agent = User::factory()->create();
    $agent->assignRole('Agent');
    $agent->countries()->attach($country);

    $actor = User::factory()->create();

    $response = $this->actingAs($actor)->post(route('credit.recovery.record', $installment), [
        'amount' => 50000,
        'repayment_date' => now()->format('Y-m-d'),
        'payment_method' => 'virement',
        'reference' => 'REF-001',
        'proof' => UploadedFile::fake()->create('proof.pdf', 100, 'application/pdf'),
    ]);

    $response->assertRedirect();

    Notification::assertSentTo([$admin, $superAdmin], RecoveryRecorded::class);
    Notification::assertNotSentTo([$otherAdmin, $agent], RecoveryRecorded::class);
});

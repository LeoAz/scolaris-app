<?php

use App\Enums\CreditRequestStatus;
use App\Models\Country;
use App\Models\CreditRequest;
use App\Models\CreditType;
use App\Models\Stakeholder;
use App\Models\User;
use App\Notifications\CreditRequestSubmitted;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

test('a credit request can be submitted and notifications are sent', function () {
    Notification::fake();

    // Setup roles
    $adminRole = Role::create(['name' => 'Administrateur']);
    $superAdminRole = Role::create(['name' => 'Super admin']);
    $controllerRole = Role::create(['name' => 'Controlleur (Dossier)']);

    // Create recipients
    $admin = User::factory()->create();
    $admin->assignRole($adminRole);

    $superAdmin = User::factory()->create();
    $superAdmin->assignRole($superAdminRole);

    $country = Country::factory()->create();
    $controller = User::factory()->create();
    $controller->assignRole($controllerRole);
    $controller->countries()->attach($country);

    // Create a credit request
    $creator = User::factory()->create();
    $student = Stakeholder::factory()->create();
    $guarantor = Stakeholder::factory()->create();
    $creditType = CreditType::factory()->create();

    $creditRequest = CreditRequest::create([
        'code' => 'CR-001',
        'country_id' => $country->id,
        'credit_type_id' => $creditType->id,
        'student_id' => $student->id,
        'guarantor_id' => $guarantor->id,
        'amount_requested' => 1000000,
        'status' => CreditRequestStatus::CREATION,
        'created_by_id' => $creator->id,
    ]);

    $this->actingAs($creator);

    $response = $this->post(route('credit.submit', $creditRequest));

    $response->assertRedirect();
    $creditRequest->refresh();

    expect($creditRequest->status)->toBe(CreditRequestStatus::SOUMIS);
    expect($creditRequest->submitted_at)->not->toBeNull();

    // Assert notifications were sent
    Notification::assertSentTo(
        [$admin, $superAdmin, $controller],
        CreditRequestSubmitted::class
    );

    // Creator should also get a notification (via database)
    Notification::assertSentTo(
        $creator,
        CreditRequestSubmitted::class
    );
});

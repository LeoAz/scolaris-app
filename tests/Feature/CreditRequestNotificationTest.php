<?php

use App\Models\Country;
use App\Models\CreditType;
use App\Models\User;
use App\Notifications\CreditRequestCreated;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

test('notifications are sent when a credit request is created', function () {
    Notification::fake();

    // Setup roles
    $adminRole = Role::create(['name' => 'Administrateur']);
    $superAdminRole = Role::create(['name' => 'Super admin']);

    // Create recipients
    $admin = User::factory()->create();
    $admin->assignRole($adminRole);

    $superAdmin = User::factory()->create();
    $superAdmin->assignRole($superAdminRole);

    $country = Country::factory()->create();
    $controller = User::factory()->create();
    $controller->countries()->attach($country);

    $otherUser = User::factory()->create();

    // Authenticate a user
    $this->actingAs($admin);

    $creditType = CreditType::factory()->create();

    $payload = [
        'country_id' => $country->id,
        'credit_type_id' => $creditType->id,
        'amount_requested' => 1000000,
        'initial_contribution' => 100000,
        'creation_date' => now()->format('Y-m-d'),
        'student' => [
            'last_name' => 'Doe',
            'first_name' => 'John',
            'email' => 'john@example.com',
            'whatsapp_number' => '123456789',
        ],
        'guarantor' => [
            'last_name' => 'Smith',
            'first_name' => 'Jane',
            'email' => 'jane@example.com',
            'whatsapp_number' => '987654321',
        ],
    ];

    $response = $this->post(route('credit.store'), $payload);

    $response->assertRedirect();

    // Assert notifications were sent to the right people
    Notification::assertSentTo(
        [$admin, $superAdmin, $controller],
        CreditRequestCreated::class
    );

    // Assert notification was NOT sent to others
    Notification::assertNotSentTo(
        [$otherUser],
        CreditRequestCreated::class
    );
});

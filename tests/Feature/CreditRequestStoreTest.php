<?php

use App\Models\Country;
use App\Models\CreditType;
use App\Models\Stakeholder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::firstOrCreate(['name' => 'Super admin', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'Administrateur', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'Controlleur (Dossier)', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'Agent', 'guard_name' => 'web']);

    $this->user = User::factory()->create(['email_verified_at' => now()]);
    $this->user->assignRole('Super admin');

    // Create the permission if it's checked by the middleware
    Permission::firstOrCreate(['name' => 'credit.store', 'guard_name' => 'web']);
    $this->user->givePermissionTo('credit.store');

    // Clear permissions cache to ensure the role and permission are recognized
    app()[PermissionRegistrar::class]->forgetCachedPermissions();

    $this->country = Country::firstOrCreate(['code' => 'SN'], ['name' => 'Sénégal']);
    $this->creditType = CreditType::firstOrCreate(['name' => 'Scolarité'], [
        'rate' => 5.0,
        'duration_months' => 10,
    ]);

    // Give access to country and credit type
    $this->user->countries()->attach($this->country->id);
    $this->user->creditTypes()->attach($this->creditType->id);

    $this->user->refresh();
});

test('on peut créer un dossier avec un garant', function () {
    $this->actingAs($this->user);

    $data = [
        'country_id' => $this->country->id,
        'credit_type_id' => $this->creditType->id,
        'amount_requested' => 1000000,
        'initial_contribution' => 100000,
        'creation_date' => now()->format('Y-m-d'),
        'student' => [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john.doe@example.com',
        ],
        'guarantor' => [
            'first_name' => 'Jane',
            'last_name' => 'Guarantor',
            'email' => 'guarantor@example.com',
        ],
    ];

    $response = $this->post(route('credit.store'), $data);

    $response->assertRedirect();
    $this->assertDatabaseHas('credit_requests', [
        'amount_requested' => 1000000,
    ]);

    $guarantor = Stakeholder::where('email', 'guarantor@example.com')->first();
    expect($guarantor)->not->toBeNull();

    $this->assertDatabaseHas('credit_requests', [
        'guarantor_id' => $guarantor->id,
    ]);
});

test('on ne peut pas créer un dossier sans email de garant', function () {
    $this->actingAs($this->user);

    $data = [
        'country_id' => $this->country->id,
        'credit_type_id' => $this->creditType->id,
        'amount_requested' => 1000000,
        'initial_contribution' => 100000,
        'creation_date' => now()->format('Y-m-d'),
        'student' => [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john.doe@example.com',
        ],
        'guarantor' => [
            'first_name' => '',
            'last_name' => '',
            'email' => '',
        ],
    ];

    $response = $this->post(route('credit.store'), $data);

    $response->assertSessionHasErrors(['guarantor.email']);
});

test('on ne peut pas utiliser le même email pour deux étudiants différents', function () {
    $this->actingAs($this->user);

    Stakeholder::factory()->create([
        'email' => 'duplicate@example.com',
        'type' => 'student',
    ]);

    $data = [
        'country_id' => $this->country->id,
        'credit_type_id' => $this->creditType->id,
        'amount_requested' => 1000000,
        'initial_contribution' => 100000,
        'creation_date' => now()->format('Y-m-d'),
        'student' => [
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'email' => 'duplicate@example.com',
        ],
        'guarantor' => [
            'first_name' => '',
            'last_name' => '',
            'email' => 'guarantor_dup@example.com',
        ],
    ];

    $response = $this->post(route('credit.store'), $data);

    $response->assertStatus(302); // Redirect back with errors
    $response->assertSessionHasErrors(['student.email']);
});

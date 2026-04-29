<?php

use App\Models\Country;
use App\Models\CreditRequest;
use App\Models\CreditType;
use App\Models\Stakeholder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Setup roles
    Role::firstOrCreate(['name' => 'Super admin', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'Administrateur', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'Super Administrateur', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'Controlleur (Dossier)', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'Validateur', 'guard_name' => 'web']);

    $this->user = User::factory()->create();
    $this->user->assignRole('Super admin');

    $this->country = Country::firstOrCreate(['code' => 'SN'], ['name' => 'Sénégal']);
    $this->creditType = CreditType::factory()->create();

    // Permissions basées sur les noms de routes pour CheckRoutePermission
    $routePermissions = [
        'credit.index',
        'credit.store',
        'credit.create',
        'credit.show',
        'credit.update',
        'credit.destroy',
        'credit.edit',
    ];

    foreach ($routePermissions as $permission) {
        Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
    }

    $this->user->givePermissionTo($routePermissions);
});

test('on peut créer un dossier de crédit via le contrôleur', function () {
    $this->actingAs($this->user);

    $data = [
        'country_id' => $this->country->id,
        'credit_type_id' => $this->creditType->id,
        'amount_requested' => 1500000,
        'initial_contribution' => 150000,
        'creation_date' => now()->format('Y-m-d'),
        'student' => [
            'first_name' => 'Alice',
            'last_name' => 'Wonderland',
            'email' => 'alice@example.com',
            'whatsapp_number' => '+221770000001',
            'address' => 'Dakar, SN',
            'profession' => 'Etudiante',
        ],
        'guarantor' => [
            'first_name' => 'Bob',
            'last_name' => 'Sponge',
            'email' => 'bob@example.com',
            'whatsapp_number' => '+221770000002',
            'address' => 'Bikini Bottom',
            'profession' => 'Cuisinier',
        ],
    ];

    $response = $this->post(route('credit.store'), $data);

    $response->assertRedirect();

    $this->assertDatabaseHas('credit_requests', [
        'amount_requested' => 1500000,
        'country_id' => $this->country->id,
    ]);

    $this->assertDatabaseHas('stakeholders', [
        'email' => 'alice@example.com',
        'type' => 'student',
    ]);

    $this->assertDatabaseHas('stakeholders', [
        'email' => 'bob@example.com',
        'type' => 'guarantor',
    ]);
});

test('on peut modifier un dossier de crédit via le contrôleur', function () {
    $this->actingAs($this->user);

    $student = Stakeholder::factory()->student()->create();
    $guarantor = Stakeholder::factory()->guarantor()->create(['student_id' => $student->id]);

    $creditRequest = CreditRequest::factory()->create([
        'country_id' => $this->country->id,
        'credit_type_id' => $this->creditType->id,
        'student_id' => $student->id,
        'guarantor_id' => $guarantor->id,
        'amount_requested' => 1000000,
    ]);

    $data = [
        'country_id' => $this->country->id,
        'credit_type_id' => $this->creditType->id,
        'amount_requested' => 2000000, // Updated amount
        'initial_contribution' => 200000,
        'creation_date' => now()->format('Y-m-d'),
        'student' => [
            'id' => $student->id,
            'first_name' => 'Alice Updated',
            'last_name' => 'Wonderland',
            'email' => 'alice.updated@example.com',
            'whatsapp_number' => '+221770000001',
        ],
        'guarantor' => [
            'id' => $guarantor->id,
            'first_name' => 'Bob Updated',
            'last_name' => 'Sponge',
            'email' => 'bob.updated@example.com',
            'whatsapp_number' => '+221770000002',
        ],
    ];

    $response = $this->put(route('credit.update', $creditRequest), $data);

    $response->assertRedirect();

    $this->assertDatabaseHas('credit_requests', [
        'id' => $creditRequest->id,
        'amount_requested' => 2000000,
    ]);

    $this->assertDatabaseHas('stakeholders', [
        'id' => $student->id,
        'first_name' => 'Alice Updated',
        'email' => 'alice.updated@example.com',
    ]);

    $this->assertDatabaseHas('stakeholders', [
        'id' => $guarantor->id,
        'first_name' => 'Bob Updated',
        'email' => 'bob.updated@example.com',
    ]);
});

test('on peut supprimer un dossier de crédit via le contrôleur', function () {
    $this->actingAs($this->user);

    $creditRequest = CreditRequest::factory()->create([
        'country_id' => $this->country->id,
        'credit_type_id' => $this->creditType->id,
    ]);

    $response = $this->delete(route('credit.destroy', $creditRequest));

    $response->assertRedirect(route('credit.index'));

    $this->assertSoftDeleted('credit_requests', [
        'id' => $creditRequest->id,
    ]);
});

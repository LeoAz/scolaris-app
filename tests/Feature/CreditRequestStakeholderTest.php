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
    $this->country = Country::factory()->create(['name' => 'Cameroun']);
    $this->creditType = CreditType::factory()->create();
    $this->user = User::factory()->create();
    $this->user->assignRole(Role::firstOrCreate(['name' => 'Super admin']));
    $this->user->countries()->attach($this->country);
    $this->user->creditTypes()->attach($this->creditType);
    $this->actingAs($this->user);

    // On ajoute les permissions nécessaires si elles sont vérifiées par le middleware
    Permission::firstOrCreate(['name' => 'credit.store']);
    Permission::firstOrCreate(['name' => 'credit.update']);
    $this->user->givePermissionTo(['credit.store', 'credit.update']);

    // Créer les rôles requis par le système de notification
    Role::firstOrCreate(['name' => 'Controlleur (Dossier)']);
    Role::firstOrCreate(['name' => 'Comptable']);

    session(['selected_country_id' => $this->country->id]);
});

test('un dossier peut être créé avec un garant sans email', function () {
    $response = $this->post('/credit/requests', [
        'country_id' => $this->country->id,
        'credit_type_id' => $this->creditType->id,
        'amount_requested' => 1000000,
        'creation_date' => now()->format('Y-m-d'),
        'student' => [
            'last_name' => 'Etudiant',
            'first_name' => 'Test',
            'email' => 'student@test.com',
            'whatsapp_number' => '123456789',
        ],
        'guarantor' => [
            'last_name' => 'Garant',
            'first_name' => 'Sans Email',
            'email' => '', // Email vide
            'whatsapp_number' => '987654321',
        ],
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('stakeholders', [
        'last_name' => 'Garant',
        'email' => null,
        'type' => 'guarantor',
    ]);
});

test('un dossier ne peut pas être créé avec un étudiant sans email', function () {
    $response = $this->post('/credit/requests', [
        'country_id' => $this->country->id,
        'credit_type_id' => $this->creditType->id,
        'amount_requested' => 1000000,
        'creation_date' => now()->format('Y-m-d'),
        'student' => [
            'last_name' => 'Etudiant',
            'first_name' => 'Sans Email',
            'email' => '', // Email vide
            'whatsapp_number' => '123456789',
        ],
        'guarantor' => [
            'last_name' => 'Garant',
            'first_name' => 'Test',
            'whatsapp_number' => '987654321',
        ],
    ]);

    $response->assertSessionHasErrors('student.email');
});

test('un garant existant sans email peut être mis à jour via son ID', function () {
    $student = Stakeholder::create([
        'type' => 'student',
        'last_name' => 'Etudiant',
        'first_name' => 'Test',
        'email' => 'student@test.com',
    ]);

    $guarantor = Stakeholder::create([
        'type' => 'guarantor',
        'last_name' => 'Garant',
        'first_name' => 'Ancien',
        'email' => null,
        'student_id' => $student->id,
    ]);

    $creditRequest = CreditRequest::create([
        'code' => 'TEST-001',
        'country_id' => $this->country->id,
        'credit_type_id' => $this->creditType->id,
        'student_id' => $student->id,
        'guarantor_id' => $guarantor->id,
        'amount_requested' => 500000,
        'status' => 'creation',
        'created_by_id' => $this->user->id,
    ]);

    $response = $this->put("/credit/requests/{$creditRequest->id}", [
        'country_id' => $this->country->id,
        'credit_type_id' => $this->creditType->id,
        'amount_requested' => 600000,
        'creation_date' => now()->format('Y-m-d'),
        'student' => [
            'id' => $student->id,
            'last_name' => 'Etudiant',
            'first_name' => 'Test',
            'email' => 'student@test.com',
            'whatsapp_number' => '123456789',
        ],
        'guarantor' => [
            'id' => $guarantor->id,
            'last_name' => 'Garant',
            'first_name' => 'Mis à jour',
            'email' => '',
            'whatsapp_number' => '987654321',
        ],
    ]);

    $response->assertRedirect();
    $guarantor->refresh();
    expect($guarantor->first_name)->toBe('Mis à jour');
    expect($guarantor->email)->toBeNull();
});

test('un dossier ne peut pas être créé sans numéro whatsapp pour l\'étudiant', function () {
    $response = $this->post('/credit/requests', [
        'country_id' => $this->country->id,
        'credit_type_id' => $this->creditType->id,
        'amount_requested' => 1000000,
        'creation_date' => now()->format('Y-m-d'),
        'student' => [
            'last_name' => 'Etudiant',
            'first_name' => 'Test',
            'email' => 'student2@test.com',
            'whatsapp_number' => '', // Vide
        ],
        'guarantor' => [
            'last_name' => 'Garant',
            'first_name' => 'Test',
            'whatsapp_number' => '987654321',
        ],
    ]);

    $response->assertSessionHasErrors('student.whatsapp_number');
});

test('un dossier ne peut pas être créé sans numéro whatsapp pour le garant', function () {
    $response = $this->post('/credit/requests', [
        'country_id' => $this->country->id,
        'credit_type_id' => $this->creditType->id,
        'amount_requested' => 1000000,
        'creation_date' => now()->format('Y-m-d'),
        'student' => [
            'last_name' => 'Etudiant',
            'first_name' => 'Test',
            'email' => 'student3@test.com',
            'whatsapp_number' => '123456789',
        ],
        'guarantor' => [
            'last_name' => 'Garant',
            'first_name' => 'Test',
            'whatsapp_number' => '', // Vide
        ],
    ]);

    $response->assertSessionHasErrors('guarantor.whatsapp_number');
});

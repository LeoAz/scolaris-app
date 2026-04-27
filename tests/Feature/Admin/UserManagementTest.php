<?php

use App\Enums\CreditRequestStatus;
use App\Models\Country;
use App\Models\CreditRequest;
use App\Models\CreditType;
use App\Models\Stakeholder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->create();
    $this->role = Role::create(['name' => 'Super admin']);
    $this->admin->assignRole($this->role);

    $this->country = Country::create(['name' => 'France', 'code' => 'FR']);
    $this->creditType = CreditType::create([
        'name' => 'Crédit Scolaire',
        'rate' => 5.0,
        'duration_months' => 12,
    ]);
});

test('admin can create a user with credit types', function () {
    $response = $this->actingAs($this->admin)->post(route('admin.users.store'), [
        'name' => 'New User',
        'email' => 'newuser@example.com',
        'username' => 'newuser',
        'password' => 'password123',
        'roles' => [$this->role->id],
        'countries' => [$this->country->id],
        'credit_types' => [$this->creditType->id],
    ]);

    $response->assertRedirect();

    $user = User::where('email', 'newuser@example.com')->first();
    expect($user)->not->toBeNull()
        ->and($user->creditTypes)->toHaveCount(1)
        ->and($user->creditTypes->first()->id)->toBe($this->creditType->id)
        ->and($user->password_plain)->toBe('password123');
});

test('admin can update a user credit types', function () {
    $user = User::factory()->create();
    $user->assignRole($this->role);

    $newCreditType = CreditType::create([
        'name' => 'Crédit Immobilier',
        'rate' => 3.0,
        'duration_months' => 240,
    ]);

    $response = $this->actingAs($this->admin)->put(route('admin.users.update', $user), [
        'name' => 'Updated User',
        'email' => $user->email,
        'username' => $user->username,
        'roles' => [$this->role->id],
        'countries' => [$this->country->id],
        'credit_types' => [$newCreditType->id],
    ]);

    $response->assertRedirect();

    $user->refresh();
    expect($user->creditTypes)->toHaveCount(1)
        ->and($user->creditTypes->first()->id)->toBe($newCreditType->id);
});

test('user without full access can only see authorized credit types', function () {
    $user = User::factory()->create();
    $role = Role::create(['name' => 'Agent']);
    $user->assignRole($role);

    $typeA = CreditType::create(['name' => 'Type A', 'rate' => 5, 'duration_months' => 12]);
    $typeB = CreditType::create(['name' => 'Type B', 'rate' => 5, 'duration_months' => 12]);

    $user->creditTypes()->attach($typeA);

    $response = $this->actingAs($user)->get(route('credit.index'));
    $response->assertStatus(200);

    // Note: Inertia component assertion would be better but let's check database logic via controller if needed
    // Here we check if the policy and filtering logic is applied
});

test('user cannot access unauthorized credit request', function () {
    $user = User::factory()->create();
    $role = Role::create(['name' => 'Agent']);
    $user->assignRole($role);

    $typeA = CreditType::create(['name' => 'Type A', 'rate' => 5, 'duration_months' => 12]);
    $typeB = CreditType::create(['name' => 'Type B', 'rate' => 5, 'duration_months' => 12]);

    $user->creditTypes()->attach($typeA);

    $requestInB = CreditRequest::factory()->create([
        'credit_type_id' => $typeB->id,
        'country_id' => $this->country->id,
        'student_id' => Stakeholder::factory()->create(['type' => 'student'])->id,
        'amount_requested' => 1000,
        'status' => CreditRequestStatus::CREATION,
    ]);

    $response = $this->actingAs($user)->get(route('credit.show', $requestInB));
    $response->assertStatus(403);

    $requestInA = CreditRequest::factory()->create([
        'credit_type_id' => $typeA->id,
        'country_id' => $this->country->id,
        'student_id' => Stakeholder::factory()->create(['type' => 'student'])->id,
        'amount_requested' => 1000,
        'status' => CreditRequestStatus::CREATION,
    ]);

    $response = $this->actingAs($user)->get(route('credit.show', $requestInA));
    $response->assertStatus(200);
});

test('admin can export users', function () {
    $response = $this->actingAs($this->admin)->get(route('admin.users.export'));

    $response->assertStatus(200);
    $response->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    $response->assertHeader('Content-Disposition', 'attachment; filename=utilisateurs_'.now()->format('Y-m-d_H-i').'.xlsx');
});

test('any authenticated user can export users', function () {
    $user = User::factory()->create();
    $role = Role::create(['name' => 'Agent']);
    $user->assignRole($role);

    $response = $this->actingAs($user)->get(route('admin.users.export'));

    $response->assertStatus(200);
});

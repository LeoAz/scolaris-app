<?php

use App\Enums\CreditRequestStatus;
use App\Models\Country;
use App\Models\CreditRequest;
use App\Models\CreditType;
use App\Models\Stakeholder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('can create a credit type', function () {
    $creditType = CreditType::factory()->create([
        'name' => 'Prêt Etudiant Standard',
        'rate' => 5.5,
        'duration_months' => 24,
    ]);

    expect($creditType->name)->toBe('Prêt Etudiant Standard');
    expect($creditType->rate)->toBe('5.50');
});

test('can create stakeholders', function () {
    $student = Stakeholder::factory()->student()->create([
        'first_name' => 'Jean',
        'last_name' => 'Dupont',
    ]);

    $guarantor = Stakeholder::factory()->guarantor()->create([
        'first_name' => 'Marc',
        'last_name' => 'Durand',
    ]);

    expect($student->type)->toBe('student');
    expect($guarantor->type)->toBe('guarantor');
    expect($student->full_name)->toBe('Jean Dupont');
});

test('can create a credit request and link it to student and guarantor', function () {
    $user = User::factory()->create(['username' => 'testuser']);
    $country = Country::factory()->create();
    $creditType = CreditType::factory()->create();
    $student = Stakeholder::factory()->student()->create();
    $guarantor = Stakeholder::factory()->guarantor()->create();

    $request = CreditRequest::factory()->create([
        'credit_type_id' => $creditType->id,
        'student_id' => $student->id,
        'guarantor_id' => $guarantor->id,
        'created_by_id' => $user->id,
        'country_id' => $country->id,
        'amount_requested' => 10000,
    ]);

    expect($request->student->id)->toBe($student->id);
    expect($request->guarantor->id)->toBe($guarantor->id);
    expect($request->creditType->id)->toBe($creditType->id);
    expect($request->amount_requested)->toBe('10000.00');
    expect($request->status)->toBe(CreditRequestStatus::CREATION);
});

test('it can generate a unique code for credit request', function () {
    $country = Country::factory()->create(['code' => 'FR']);
    $student = Stakeholder::factory()->student()->create([
        'last_name' => 'Dupont',
        'first_name' => 'Jean',
    ]);

    $code = CreditRequest::generateCode($country, $student);

    $expectedPrefix = 'FR_SCF_'.now()->format('Ym').'_000001_dupont_jean';
    expect($code)->toBe($expectedPrefix);
});

test('it resets increment number every month', function () {
    $country = Country::factory()->create(['code' => 'FR']);
    $student1 = Stakeholder::factory()->student()->create([
        'last_name' => 'Dupont',
        'first_name' => 'Jean',
    ]);

    // Create a request for last month
    $lastMonth = now()->subMonth();
    $oldPrefix = 'FR_SCF_'.$lastMonth->format('Ym');
    CreditRequest::factory()->create([
        'country_id' => $country->id,
        'student_id' => $student1->id,
        'code' => "{$oldPrefix}_000005_dupont_jean",
    ]);

    // Generate code for current month
    $student2 = Stakeholder::factory()->student()->create([
        'last_name' => 'Durand',
        'first_name' => 'Marc',
    ]);
    $newCode = CreditRequest::generateCode($country, $student2);

    $currentMonthPrefix = 'FR_SCF_'.now()->format('Ym');
    expect($newCode)->toBe("{$currentMonthPrefix}_000001_durand_marc");
});

test('it can store a new credit request via controller', function () {
    $user = User::factory()->create();
    $country = Country::factory()->create(['code' => 'CI']);
    $creditType = CreditType::factory()->create();

    $response = $this->actingAs($user)->post(route('credit.store'), [
        'country_id' => $country->id,
        'credit_type_id' => $creditType->id,
        'amount_requested' => 500000,
        'initial_contribution' => 50000,
        'creation_date' => now()->format('Y-m-d'),
        'student' => [
            'first_name' => 'Jean',
            'last_name' => 'Koffi',
            'email' => 'jean.koffi@example.com',
            'whatsapp_number' => '+2250102030405',
        ],
        'guarantor' => [
            'first_name' => 'Marie',
            'last_name' => 'Kone',
            'email' => 'marie.kone@example.com',
        ],
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('credit_requests', [
        'country_id' => $country->id,
        'amount_requested' => 500000,
    ]);

    $this->assertDatabaseHas('stakeholders', [
        'first_name' => 'Jean',
        'last_name' => 'Koffi',
        'type' => 'student',
    ]);

    $this->assertDatabaseHas('stakeholders', [
        'first_name' => 'Marie',
        'last_name' => 'Kone',
        'type' => 'guarantor',
        'student_id' => Stakeholder::where('last_name', 'Koffi')->first()->id,
    ]);
});

test('it can search for guarantors', function () {
    $user = User::factory()->create();
    Stakeholder::factory()->guarantor()->create([
        'first_name' => 'Adama',
        'last_name' => 'Traore',
        'email' => 'adama@example.com',
    ]);

    $response = $this->actingAs($user)->get(route('credit.guarantors.search', ['query' => 'Adama']));

    $response->assertStatus(200);
    $response->assertJsonFragment(['first_name' => 'Adama', 'last_name' => 'Traore']);
});

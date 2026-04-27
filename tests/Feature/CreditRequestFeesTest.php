<?php

use App\Models\Country;
use App\Models\CreditRequest;
use App\Models\CreditType;
use App\Models\Stakeholder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('it calculates credit request fees correctly for non-Togo country', function () {
    $user = User::factory()->create();
    $country = Country::firstOrCreate(['code' => 'BJ'], ['name' => 'Bénin']);
    $creditType = CreditType::factory()->create(['rate' => 12]); // 12% annuel
    $student = Stakeholder::factory()->create(['type' => 'student']);
    $guarantor = Stakeholder::factory()->create(['type' => 'guarantor']);

    $creditRequest = CreditRequest::create([
        'code' => 'TEST_001',
        'country_id' => $country->id,
        'credit_type_id' => $creditType->id,
        'student_id' => $student->id,
        'guarantor_id' => $guarantor->id,
        'created_by_id' => $user->id,
        'amount_requested' => 1000000,
        'initial_contribution' => 0,
        'status' => 'creation',
    ]);

    $creditRequest->calculateFees();

    // Assurance: 1% de 1,000,000 = 10,000
    expect((float) $creditRequest->insurance_amount)->toBe(10000.0);

    // Frais variables: 2% de 1,000,000 = 20,000
    expect((float) $creditRequest->processing_fees_variable)->toBe(20000.0);

    // Frais fixes: 10,000
    expect((float) $creditRequest->processing_fees_fixed)->toBe(10000.0);

    // Intérêt 1er mois: 1,000,000 * (12/100) = 120,000
    expect((float) $creditRequest->first_month_interest)->toBe(120000.0);

    // Total: 10,000 + 20,000 + 10,000 + 120,000 = 160,000
    expect((float) $creditRequest->total_microfinance_fees)->toBe(160000.0);
});

test('it calculates credit request fees correctly for Togo', function () {
    $user = User::factory()->create();
    $country = Country::firstOrCreate(['code' => 'TG'], ['name' => 'Togo']);
    $creditType = CreditType::factory()->create(['rate' => 10]);
    $student = Stakeholder::factory()->create(['type' => 'student']);
    $guarantor = Stakeholder::factory()->create(['type' => 'guarantor']);

    $creditRequest = CreditRequest::create([
        'code' => 'TEST_002',
        'country_id' => $country->id,
        'credit_type_id' => $creditType->id,
        'student_id' => $student->id,
        'guarantor_id' => $guarantor->id,
        'created_by_id' => $user->id,
        'amount_requested' => 1000000,
        'initial_contribution' => 0,
        'status' => 'creation',
    ]);

    $creditRequest->calculateFees();

    // Frais variables pour le Togo: 1% de 1,000,000 = 10,000
    expect((float) $creditRequest->processing_fees_variable)->toBe(10000.0);
});

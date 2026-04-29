<?php

use App\Enums\CreditRequestStatus;
use App\Models\Country;
use App\Models\CreditRequest;
use App\Models\CreditType;
use App\Models\Stakeholder;
use App\Models\User;
use App\Services\DocumentGeneratorService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('it can generate pdf with correct data', function () {
    // On ne peut pas facilement tester la conversion LibreOffice dans cet environnement
    // sans l'exécutable, mais on peut tester la préparation des données.

    $user = User::factory()->create();
    $country = Country::factory()->create(['code' => 'FR']);
    $student = Stakeholder::factory()->create([
        'first_name' => 'Jean',
        'last_name' => 'Dupont',
        'address' => '123 Rue de la Paix',
    ]);
    $creditType = CreditType::factory()->create([
        'rate' => 5.5,
        'duration_months' => 12,
    ]);

    $creditRequest = CreditRequest::create([
        'code' => CreditRequest::generateCode($country, $student),
        'credit_type_id' => $creditType->id,
        'student_id' => $student->id,
        'guarantor_id' => Stakeholder::factory()->create()->id,
        'created_by_id' => $user->id,
        'country_id' => $country->id,
        'amount_requested' => 1000000,
        'status' => CreditRequestStatus::CREATION,
    ]);

    $service = new DocumentGeneratorService;

    // Accéder à la méthode protégée via réflexion pour tester le formatage
    $reflection = new ReflectionClass($service);
    $method = $reflection->getMethod('prepareData');
    $method->setAccessible(true);

    $data = $method->invoke($service, $creditRequest, []);

    expect($data['student_name'])->toBe('Jean Dupont');
    expect($data['student_address'])->toBe('123 Rue de la Paix');
    expect($data['loan_amount'])->toBe('1 000 000 FCFA');
    expect($data['interest_rate'])->toBe('5,50 %');
    expect($data['loan_duration'])->toBe('12 mois');
    expect($data['payment_frequency'])->toBe('Mensuelle');
    expect($data['Date'])->toBe(now()->format('d/m/Y'));
});

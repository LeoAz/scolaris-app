<?php

use App\Enums\CreditRequestStatus;
use App\Events\LoanValidated;
use App\Models\Country;
use App\Models\CreditRequest;
use App\Models\CreditRequestInstallment;
use App\Models\CreditType;
use App\Models\Stakeholder;
use App\Models\User;
use App\Notifications\LoanValidatedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Créer les rôles nécessaires
    Role::firstOrCreate(['name' => 'Administrateur', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'Super admin', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'Controlleur (Dossier)', 'guard_name' => 'web']);

    $this->user = User::factory()->create();
    $this->user->assignRole('Super admin');

    $this->country = Country::create(['name' => 'Sénégal', 'code' => 'SN']);
    $this->creditType = CreditType::create([
        'name' => 'Scolarité',
        'rate' => 5.0,
        'duration_months' => 10,
    ]);

    $this->student = Stakeholder::factory()->create();
    $this->guarantor = Stakeholder::factory()->create();

    $this->creditRequest = CreditRequest::create([
        'code' => 'SN_TEST_001',
        'credit_type_id' => $this->creditType->id,
        'student_id' => $this->student->id,
        'guarantor_id' => $this->guarantor->id,
        'country_id' => $this->country->id,
        'created_by_id' => $this->user->id,
        'amount_requested' => 1000000,
        'initial_contribution' => 100000,
        'status' => CreditRequestStatus::SOUMIS,
    ]);
});

/**
 * Helper to make a credit request complete by adding required documents.
 */
function makeComplete(CreditRequest $creditRequest)
{
    foreach (CreditRequest::getRequiredDocumentTypes() as $type => $label) {
        $creditRequest->addMedia(UploadedFile::fake()->image('test.jpg'))
            ->preservingOriginal()
            ->withCustomProperties(['type' => $type, 'user_id' => $creditRequest->created_by_id])
            ->toMediaCollection('documents');
    }
}

test('un dossier soumis et complet peut être validé', function () {
    $this->actingAs($this->user);

    makeComplete($this->creditRequest);
    expect($this->creditRequest->isComplete())->toBeTrue();

    Event::fake();
    Notification::fake();

    $response = $this->post(route('credit.validate', $this->creditRequest));

    $response->assertRedirect();
    $this->creditRequest->refresh();

    expect($this->creditRequest->status)->toBe(CreditRequestStatus::VALIDER);
    expect($this->creditRequest->validated_at)->not->toBeNull();
    expect($this->creditRequest->validated_by_id)->toBe($this->user->id);

    Event::assertDispatched(LoanValidated::class);
});

test('la validation déclenche le calcul de l\'amortissement', function () {
    $this->actingAs($this->user);
    makeComplete($this->creditRequest);

    $this->post(route('credit.validate', $this->creditRequest));

    // Vérifier que les mensualités ont été créées
    $installments = CreditRequestInstallment::where('credit_request_id', $this->creditRequest->id)->get();

    expect($installments)->toHaveCount($this->creditType->duration_months);
    $sum = (float) $installments->sum('principal_amount');
    expect($sum)->toBeGreaterThan(999999.0);
    expect($sum)->toBeLessThan(1000001.0);
});

test('la validation notifie les administrateurs et contrôleurs', function () {
    Notification::fake();
    $this->actingAs($this->user);
    makeComplete($this->creditRequest);

    // Créer un contrôleur pour le pays
    $controller = User::factory()->create();
    $controller->assignRole('Controlleur (Dossier)');
    $controller->countries()->attach($this->country->id);

    $this->post(route('credit.validate', $this->creditRequest));

    Notification::assertSentTo(
        [$this->user, $controller],
        LoanValidatedNotification::class
    );
});

test('un administrateur peut valider un dossier incomplet', function () {
    $this->actingAs($this->user);

    // S'assurer que le dossier est incomplet (pas de médias attachés)
    expect($this->creditRequest->isComplete())->toBeFalse();

    $response = $this->post(route('credit.validate', $this->creditRequest));

    $response->assertRedirect();
    $this->creditRequest->refresh();

    expect($this->creditRequest->status)->toBe(CreditRequestStatus::VALIDER);
});

test('un utilisateur non admin ne peut pas valider un dossier incomplet', function () {
    $agent = User::factory()->create();
    $agent->assignRole('Controlleur (Dossier)'); // Supposons que le contrôleur ne peut pas forcer la validation si incomplet
    $this->actingAs($agent);

    // S'assurer que le dossier est incomplet
    expect($this->creditRequest->isComplete())->toBeFalse();

    $response = $this->post(route('credit.validate', $this->creditRequest));

    $response->assertSessionHas('error', 'Le dossier est incomplet. Veuillez vérifier que tous les documents requis sont présents.');
    $this->creditRequest->refresh();

    expect($this->creditRequest->status)->toBe(CreditRequestStatus::SOUMIS);
});

<?php

use App\Events\LoanValidated;
use App\Jobs\GenerateDocumentJob;
use App\Models\Country;
use App\Models\CreditRequest;
use App\Models\CreditType;
use App\Models\Stakeholder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

test('loan validation triggers document generation job via listener queue', function () {
    Queue::fake();

    // Créer les rôles requis par SendLoanValidatedNotifications
    Role::create(['name' => 'Administrateur']);
    Role::create(['name' => 'Super admin']);
    Role::create(['name' => 'Controlleur (Dossier)']);

    $user = User::factory()->create();
    $this->actingAs($user);

    $country = Country::factory()->create(['code' => 'FR']);
    $student = Stakeholder::factory()->create();
    $creditType = CreditType::factory()->create();

    $creditRequest = CreditRequest::create([
        'code' => CreditRequest::generateCode($country, $student),
        'credit_type_id' => $creditType->id,
        'student_id' => $student->id,
        'guarantor_id' => Stakeholder::factory()->create()->id,
        'created_by_id' => $user->id,
        'country_id' => $country->id,
        'amount_requested' => 1000000,
        'status' => \App\Enums\CreditRequestStatus::SOUMIS,
    ]);

    // Déclencher l'événement
    LoanValidated::dispatch($creditRequest);

    // Vérifier que le listener a été mis en file d'attente
    Queue::assertPushed(\Illuminate\Events\CallQueuedListener::class, function ($job) {
        return $job->class === \App\Listeners\GenerateLoanContractListener::class;
    });
});

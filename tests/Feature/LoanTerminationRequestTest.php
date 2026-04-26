<?php

use App\Models\CreditRequest;
use App\Models\LoanTerminationRequest;
use App\Models\User;
use App\Notifications\LoanTerminationRequestedNotification;
use App\Notifications\LoanTerminationProcessedNotification;
use App\Enums\CreditRequestStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);

    // S'assurer que les rôles existent
    Role::firstOrCreate(['name' => 'Super admin']);
    Role::firstOrCreate(['name' => 'Administrateur']);
    Role::firstOrCreate(['name' => 'Controlleur (Dossier)']);
});

test('un utilisateur peut soumettre une demande de résiliation', function () {
    Notification::fake();

    $admin = User::factory()->create();
    $admin->assignRole('Administrateur');

    $creditRequest = CreditRequest::factory()->create();

    $response = $this->post(route('credit.termination-requests.store', $creditRequest), [
        'requested_date' => now()->addDays(7)->format('Y-m-d'),
        'reason' => 'Remboursement anticipé',
        'description' => 'Je souhaite résilier mon prêt car j\'ai les fonds nécessaires.',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('loan_termination_requests', [
        'credit_request_id' => $creditRequest->id,
        'reason' => 'Remboursement anticipé',
        'status' => 'pending',
    ]);

    Notification::assertSentTo(
        $admin,
        LoanTerminationRequestedNotification::class
    );
});

test('un administrateur peut approuver une demande de résiliation', function () {
    Notification::fake();

    $admin = User::factory()->create();
    $admin->assignRole('Administrateur');

    $terminationRequest = LoanTerminationRequest::factory()->create(['status' => 'pending']);
    $creditRequest = $terminationRequest->creditRequest;

    // Créer des mensualités pour ce dossier
    $creditRequest->installments()->createMany([
        [
            'installment_number' => 1,
            'due_date' => now()->addMonth(),
            'principal_amount' => 1000,
            'interest_amount' => 10,
            'total_amount' => 1010,
            'remaining_principal' => 5000,
            'status' => 'pending'
        ],
        [
            'installment_number' => 2,
            'due_date' => now()->addMonths(2),
            'principal_amount' => 1000,
            'interest_amount' => 10,
            'total_amount' => 1010,
            'remaining_principal' => 4000,
            'status' => 'pending'
        ]
    ]);

    $response = $this->actingAs($admin)
        ->post(route('credit.termination-requests.approve', $terminationRequest));

    $response->assertRedirect();
    $this->assertDatabaseHas('loan_termination_requests', [
        'id' => $terminationRequest->id,
        'status' => 'approved',
        'processed_by_id' => $admin->id,
    ]);

    // Vérifier que le statut du crédit a été mis à jour en "rejeter"
    $this->assertDatabaseHas('credit_requests', [
        'id' => $creditRequest->id,
        'status' => CreditRequestStatus::REJETER->value,
        'rejected_by_id' => $admin->id,
    ]);

    // Vérifier que les mensualités ont été annulées
    $this->assertEquals(0, $creditRequest->installments()->where('status', 'pending')->count());
    $this->assertEquals(2, $creditRequest->installments()->where('status', 'cancelled')->count());

    Notification::assertSentTo(
        [$terminationRequest->user, $admin],
        LoanTerminationProcessedNotification::class
    );
});

test('un administrateur peut rejeter une demande de résiliation avec un motif', function () {
    Notification::fake();

    $admin = User::factory()->create();
    $admin->assignRole('Administrateur');

    $terminationRequest = LoanTerminationRequest::factory()->create(['status' => 'pending']);
    $creditRequest = $terminationRequest->creditRequest;
    $initialStatus = $creditRequest->status;

    $response = $this->actingAs($admin)
        ->post(route('credit.termination-requests.reject', $terminationRequest), [
            'rejection_reason' => 'Motif incomplet',
        ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('loan_termination_requests', [
        'id' => $terminationRequest->id,
        'status' => 'rejected',
        'rejection_reason' => 'Motif incomplet',
        'processed_by_id' => $admin->id,
    ]);

    // Vérifier que le statut du crédit n'a pas changé
    $creditRequest->refresh();
    expect($creditRequest->status)->toBe($initialStatus);

    Notification::assertSentTo(
        [$terminationRequest->user, $admin],
        LoanTerminationProcessedNotification::class
    );
});

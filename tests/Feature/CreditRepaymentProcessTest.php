<?php

use App\Jobs\UploadRepaymentProof;
use App\Models\CreditRequest;
use App\Models\CreditRequestInstallment;
use App\Models\CreditRequestRepayment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed();
    Storage::fake('local');
    Queue::fake();
    $this->user = User::factory()->create();
    $this->admin = User::factory()->create();
    $this->admin->assignRole('Administrateur');

    $this->creditRequest = CreditRequest::factory()->create([
        'status' => 'valider',
        'amount_requested' => 1000000,
    ]);

    $this->installment = CreditRequestInstallment::create([
        'credit_request_id' => $this->creditRequest->id,
        'installment_number' => 1,
        'due_date' => now()->addMonth(),
        'principal_amount' => 100000,
        'interest_amount' => 10000,
        'total_amount' => 110000,
        'remaining_principal' => 1000000,
        'status' => 'pending',
    ]);
});

test('un utilisateur peut soumettre un remboursement avec une preuve', function () {
    $file = UploadedFile::fake()->create('proof.pdf', 500);

    $response = $this->actingAs($this->user)
        ->post(route('credit.installments.repayments.store', [
            'creditRequest' => $this->creditRequest->id,
            'installment' => $this->installment->id,
        ]), [
            'amount' => 110000,
            'repayment_date' => now()->format('Y-m-d'),
            'payment_method' => 'virement',
            'reference' => 'REF123',
            'proof' => $file,
        ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('credit_request_repayments', [
        'installment_id' => $this->installment->id,
        'amount' => 110000,
        'status' => 'pending',
    ]);

    Queue::assertPushed(UploadRepaymentProof::class);
});

test('un administrateur peut valider un remboursement et cela met à jour l\'échéance', function () {
    $repayment = CreditRequestRepayment::create([
        'credit_request_id' => $this->creditRequest->id,
        'installment_id' => $this->installment->id,
        'amount' => 110000,
        'repayment_date' => now(),
        'payment_method' => 'virement',
        'status' => 'pending',
    ]);

    $response = $this->actingAs($this->admin)
        ->post(route('credit.installments.repayments.validate', [
            'creditRequest' => $this->creditRequest->id,
            'repayment' => $repayment->id,
        ]));

    $response->assertRedirect();
    $this->assertEquals('validated', $repayment->fresh()->status);
    $this->assertEquals('paid', $this->installment->fresh()->status);
});

test('un administrateur peut rejeter un remboursement avec un motif', function () {
    $repayment = CreditRequestRepayment::create([
        'credit_request_id' => $this->creditRequest->id,
        'installment_id' => $this->installment->id,
        'amount' => 110000,
        'repayment_date' => now(),
        'payment_method' => 'virement',
        'status' => 'pending',
    ]);

    $response = $this->actingAs($this->admin)
        ->post(route('credit.installments.repayments.reject', [
            'creditRequest' => $this->creditRequest->id,
            'repayment' => $repayment->id,
        ]), [
            'reason' => 'Preuve illisible',
        ]);

    $response->assertRedirect();
    $this->assertEquals('rejected', $repayment->fresh()->status);
    $this->assertStringContainsString('Preuve illisible', $repayment->fresh()->notes);
    $this->assertEquals('pending', $this->installment->fresh()->status);
});

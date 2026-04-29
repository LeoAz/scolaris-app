<?php

use App\Models\CreditRequest;
use App\Models\CreditRequestInstallment;
use App\Notifications\InstallmentReminder;
use Carbon\CarbonInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

beforeEach(function () {
    Notification::fake();
});

it('sends reminders 5 days before due date', function () {
    createInstallment(now()->addDays(5));

    $this->artisan('installments:send-reminders')->assertSuccessful();

    Notification::assertSentOnDemand(InstallmentReminder::class);
});

it('sends reminders 3 days before due date', function () {
    createInstallment(now()->addDays(3));

    $this->artisan('installments:send-reminders')->assertSuccessful();

    Notification::assertSentOnDemand(InstallmentReminder::class);
});

it('sends reminders 1 day before due date', function () {
    createInstallment(now()->addDays(1));

    $this->artisan('installments:send-reminders')->assertSuccessful();

    Notification::assertSentOnDemand(InstallmentReminder::class);
});

it('sends reminders on due date', function () {
    createInstallment(now());

    $this->artisan('installments:send-reminders')->assertSuccessful();

    Notification::assertSentOnDemand(InstallmentReminder::class);
});

it('sends overdue reminders 2 days after due date', function () {
    createInstallment(now()->subDays(2));

    $this->artisan('installments:send-reminders')->assertSuccessful();

    Notification::assertSentOnDemand(InstallmentReminder::class, function ($notification) {
        return $notification->isOverdue;
    });
});

it('does not send reminders 4 days before due date', function () {
    createInstallment(now()->addDays(4));

    $this->artisan('installments:send-reminders')->assertSuccessful();

    Notification::assertNothingSent();
});

it('does not send reminders more than 14 days overdue', function () {
    createInstallment(now()->subDays(16));

    $this->artisan('installments:send-reminders')->assertSuccessful();

    Notification::assertNothingSent();
});

it('sends to both student and guarantor', function () {
    createInstallment(now()->addDays(5));

    $this->artisan('installments:send-reminders')->assertSuccessful();

    Notification::assertSentOnDemand(InstallmentReminder::class, 2);
});

it('does not send for paid installments', function () {
    $creditRequest = CreditRequest::factory()->create();

    CreditRequestInstallment::create([
        'credit_request_id' => $creditRequest->id,
        'installment_number' => 1,
        'due_date' => now()->addDays(5),
        'principal_amount' => 50000,
        'interest_amount' => 5000,
        'total_amount' => 55000,
        'remaining_principal' => 0,
        'status' => 'paid',
    ]);

    $this->artisan('installments:send-reminders')->assertSuccessful();

    Notification::assertNothingSent();
});

function createInstallment(CarbonInterface $dueDate): CreditRequestInstallment
{
    $creditRequest = CreditRequest::factory()->create();

    return CreditRequestInstallment::create([
        'credit_request_id' => $creditRequest->id,
        'installment_number' => 1,
        'due_date' => $dueDate,
        'principal_amount' => 50000,
        'interest_amount' => 5000,
        'total_amount' => 55000,
        'remaining_principal' => 50000,
        'status' => 'pending',
    ]);
}

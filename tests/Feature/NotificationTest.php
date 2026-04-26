<?php

use App\Models\Country;
use App\Models\CreditRequest;
use App\Models\CreditType;
use App\Models\Stakeholder;
use App\Models\User;
use App\Notifications\CreditRequestCreated;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('notifications table is created and working', function () {
    $user = User::factory()->create();
    $country = Country::factory()->create();
    $creditType = CreditType::factory()->create();
    $student = Stakeholder::factory()->create(['type' => 'student']);
    $guarantor = Stakeholder::factory()->create(['type' => 'guarantor', 'student_id' => $student->id]);

    $creditRequest = CreditRequest::create([
        'code' => 'TEST-001',
        'country_id' => $country->id,
        'credit_type_id' => $creditType->id,
        'student_id' => $student->id,
        'guarantor_id' => $guarantor->id,
        'amount_requested' => 1000,
        'initial_contribution' => 0,
        'status' => 'creation',
        'created_by_id' => $user->id,
    ]);

    $user->notify(new CreditRequestCreated($creditRequest));

    expect($user->notifications)->toHaveCount(1);
    expect($user->unreadNotifications)->toHaveCount(1);

    $notification = $user->notifications->first();
    expect($notification->data['message'])->toContain('TEST-001');
});

test('can mark notification as read', function () {
    $user = User::factory()->create();
    $country = Country::factory()->create();
    $creditType = CreditType::factory()->create();
    $student = Stakeholder::factory()->create(['type' => 'student']);
    $guarantor = Stakeholder::factory()->create(['type' => 'guarantor', 'student_id' => $student->id]);

    $creditRequest = CreditRequest::create([
        'code' => 'TEST-002',
        'country_id' => $country->id,
        'credit_type_id' => $creditType->id,
        'student_id' => $student->id,
        'guarantor_id' => $guarantor->id,
        'amount_requested' => 1000,
        'initial_contribution' => 0,
        'status' => 'creation',
        'created_by_id' => $user->id,
    ]);

    $user->notify(new CreditRequestCreated($creditRequest));
    $notificationId = $user->unreadNotifications->first()->id;

    $response = $this->actingAs($user)
        ->post(route('notifications.mark-as-read', $notificationId));

    $response->assertRedirect();
    expect($user->fresh()->unreadNotifications)->toHaveCount(0);
});

test('can mark all notifications as read', function () {
    $user = User::factory()->create();
    $country = Country::factory()->create();
    $creditType = CreditType::factory()->create();
    $student = Stakeholder::factory()->create(['type' => 'student']);
    $guarantor = Stakeholder::factory()->create(['type' => 'guarantor', 'student_id' => $student->id]);

    $creditRequest = CreditRequest::create([
        'code' => 'TEST-003',
        'country_id' => $country->id,
        'credit_type_id' => $creditType->id,
        'student_id' => $student->id,
        'guarantor_id' => $guarantor->id,
        'amount_requested' => 1000,
        'initial_contribution' => 0,
        'status' => 'creation',
        'created_by_id' => $user->id,
    ]);

    $user->notify(new CreditRequestCreated($creditRequest));
    $user->notify(new CreditRequestCreated($creditRequest));

    expect($user->unreadNotifications)->toHaveCount(2);

    $response = $this->actingAs($user)
        ->post(route('notifications.mark-all-as-read'));

    $response->assertRedirect();
    expect($user->fresh()->unreadNotifications)->toHaveCount(0);
});

test('can view all notifications index', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->get(route('notifications.index'));

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('notifications/index')
        ->has('all_notifications')
    );
});

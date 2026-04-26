<?php

namespace Tests\Feature;

use App\Models\Country;
use App\Models\CreditRequest;
use App\Models\CreditType;
use App\Models\Stakeholder;
use App\Models\User;
use App\Notifications\CreditRequestRejected;
use App\Enums\CreditRequestStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CreditRequestRejectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_credit_request_can_be_rejected_and_notifications_are_sent()
    {
        Notification::fake();

        // Setup roles
        $adminRole = Role::create(['name' => 'Administrateur']);
        $superAdminRole = Role::create(['name' => 'Super admin']);
        $controllerRole = Role::create(['name' => 'Controlleur (Dossier)']);

        // Create recipients
        $admin = User::factory()->create();
        $admin->assignRole($adminRole);

        $superAdmin = User::factory()->create();
        $superAdmin->assignRole($superAdminRole);

        $country = Country::factory()->create();
        $controller = User::factory()->create();
        $controller->assignRole($controllerRole);
        $controller->countries()->attach($country);

        $creator = User::factory()->create();

        // Create a credit request in submitted status
        $student = Stakeholder::factory()->create(['type' => 'student']);
        $guarantor = Stakeholder::factory()->create(['type' => 'guarantor']);
        $creditType = CreditType::factory()->create();

        $creditRequest = CreditRequest::create([
            'code' => 'TEST_CODE',
            'credit_type_id' => $creditType->id,
            'student_id' => $student->id,
            'guarantor_id' => $guarantor->id,
            'created_by_id' => $creator->id,
            'country_id' => $country->id,
            'amount_requested' => 1000000,
            'status' => CreditRequestStatus::SOUMIS->value,
        ]);

        $this->actingAs($admin);

        $response = $this->post(route('credit.reject', $creditRequest), [
            'reason' => 'Test rejection reason',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success', 'Dossier rejeté avec succès.');

        $creditRequest->refresh();
        $this->assertEquals(CreditRequestStatus::REJETER, $creditRequest->status);
        $this->assertEquals('Test rejection reason', $creditRequest->rejection_reason);
        $this->assertEquals($admin->id, $creditRequest->rejected_by_id);
        $this->assertNotNull($creditRequest->rejected_at);

        // Assert activity was created
        $this->assertDatabaseHas('credit_request_activities', [
            'credit_request_id' => $creditRequest->id,
            'user_id' => $admin->id,
            'action' => 'rejection',
        ]);

        // Assert notifications were sent
        Notification::assertSentTo(
            [$admin, $superAdmin, $controller, $creator],
            CreditRequestRejected::class,
            function ($notification, $channels) use ($creditRequest) {
                return $notification->creditRequest->id === $creditRequest->id &&
                       $notification->reason === 'Test rejection reason';
            }
        );
    }

    public function test_credit_request_cannot_be_rejected_if_not_submitted()
    {
        $adminRole = Role::create(['name' => 'Administrateur']);
        $admin = User::factory()->create();
        $admin->assignRole($adminRole);

        $student = Stakeholder::factory()->create(['type' => 'student']);
        $guarantor = Stakeholder::factory()->create(['type' => 'guarantor']);
        $creditType = CreditType::factory()->create();

        $country = Country::factory()->create();
        $creditRequest = CreditRequest::create([
            'code' => 'TEST_CODE_2',
            'credit_type_id' => $creditType->id,
            'student_id' => $student->id,
            'guarantor_id' => $guarantor->id,
            'created_by_id' => $admin->id,
            'country_id' => $country->id,
            'amount_requested' => 1000000,
            'status' => CreditRequestStatus::CREATION->value,
        ]);

        $this->actingAs($admin);

        $response = $this->post(route('credit.reject', $creditRequest), [
            'reason' => 'Should not work',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('error', "Le dossier n'est pas dans un état permettant le rejet.");

        $creditRequest->refresh();
        $this->assertEquals(CreditRequestStatus::CREATION, $creditRequest->status);
    }
}

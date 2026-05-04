<?php

use App\Models\User;
use App\Notifications\UserCreatedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

test('a notification is sent when a user is created', function () {
    Notification::fake();

    $this->artisan('db:seed', ['--class' => 'RoleSeeder']);

    $admin = User::factory()->create();
    $admin->assignRole('Administrateur');

    $role = Role::where('name', 'Administrateur')->first();

    $this->actingAs($admin)
        ->post(route('admin.users.store'), [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'username' => 'johndoe',
            'password' => 'password123',
            'roles' => [$role->id],
        ]);

    $user = User::where('email', 'john@example.com')->first();
    expect($user->must_change_password)->toBeTrue();

    Notification::assertSentTo($user, UserCreatedNotification::class);
});

test('user is redirected to force password change page if must_change_password is true', function () {
    $user = User::factory()->create(['must_change_password' => true]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertRedirect(route('auth.password.force-change'));
});

test('user can change their password and must_change_password becomes false', function () {
    $user = User::factory()->create(['must_change_password' => true]);

    $this->actingAs($user)
        ->post(route('auth.password.force-change.store'), [
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ])
        ->assertRedirect(route('dashboard'));

    $user->refresh();
    expect($user->must_change_password)->toBeFalse();
    expect(Hash::check('NewPassword123!', $user->password))->toBeTrue();
});

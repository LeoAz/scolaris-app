<?php

use App\Models\Country;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

test('un utilisateur peut se connecter avec son email, son pays et son mot de passe', function () {
    $country = Country::factory()->create(['code' => 'FR', 'name' => 'France']);
    $user = User::factory()->create([
        'email' => 'test@example.com',
        'username' => 'testuser',
        'password' => Hash::make('password123'),
    ]);
    $user->countries()->attach($country);

    $response = $this->post('/login', [
        'country' => 'France',
        'email' => 'test@example.com',
        'password' => 'password123',
    ]);

    $response->assertRedirect('/credit/requests');
    $this->assertAuthenticatedAs($user);
});

test('un utilisateur peut se connecter avec son pseudo, son pays et son mot de passe', function () {
    $country = Country::factory()->create(['code' => 'FR', 'name' => 'France']);
    $user = User::factory()->create([
        'email' => 'test@example.com',
        'username' => 'testuser',
        'password' => Hash::make('password123'),
    ]);
    $user->countries()->attach($country);

    $response = $this->post('/login', [
        'country' => 'France',
        'email' => 'testuser',
        'password' => 'password123',
    ]);

    $response->assertRedirect('/credit/requests');
    $this->assertAuthenticatedAs($user);
});

test('un administrateur peut se connecter sans pays', function () {
    $role = Role::firstOrCreate(['name' => 'Administrateur']);
    $user = User::factory()->create([
        'email' => 'admin@example.com',
        'password' => Hash::make('password123'),
    ]);
    $user->assignRole($role);

    $response = $this->post('/login', [
        'country' => '', // Pas de pays
        'email' => 'admin@example.com',
        'password' => 'password123',
    ]);

    $response->assertRedirect('/credit/requests');
    $this->assertAuthenticatedAs($user);
});

test('un super admin peut se connecter sans pays', function () {
    $role = Role::firstOrCreate(['name' => 'Super admin']);
    $user = User::factory()->create([
        'email' => 'superadmin@example.com',
        'password' => Hash::make('password123'),
    ]);
    $user->assignRole($role);

    $response = $this->post('/login', [
        'country' => '', // Pas de pays
        'email' => 'superadmin@example.com',
        'password' => 'password123',
    ]);

    $response->assertRedirect('/credit/requests');
    $this->assertAuthenticatedAs($user);
});

test('un super administrateur peut se connecter sans pays', function () {
    $role = Role::firstOrCreate(['name' => 'Super Administrateur']);
    $user = User::factory()->create([
        'email' => 'superadmin2@example.com',
        'password' => Hash::make('password123'),
    ]);
    $user->assignRole($role);

    $response = $this->post('/login', [
        'country' => '', // Pas de pays
        'email' => 'superadmin2@example.com',
        'password' => 'password123',
    ]);

    $response->assertRedirect('/credit/requests');
    $this->assertAuthenticatedAs($user);
});

test('un utilisateur standard ne peut pas se connecter sans pays', function () {
    $user = User::factory()->create([
        'email' => 'user@example.com',
        'password' => Hash::make('password123'),
    ]);

    $response = $this->post('/login', [
        'country' => '', // Pas de pays
        'email' => 'user@example.com',
        'password' => 'password123',
    ]);

    $response->assertSessionHasErrors('email');
    $this->assertGuest();
});

test('un super administrateur peut se connecter avec n\'importe quel pays', function () {
    Country::factory()->create(['code' => 'CM', 'name' => 'Cameroun']);
    $role = Role::create(['name' => 'Super admin']);
    $user = User::factory()->create([
        'email' => 'superadmin@example.com',
        'password' => Hash::make('password123'),
    ]);
    $user->assignRole($role);

    $response = $this->post('/login', [
        'country' => 'Cameroun', // Pays qu\'il ne possède pas forcément
        'email' => 'superadmin@example.com',
        'password' => 'password123',
    ]);

    $response->assertRedirect('/credit/requests');
    $this->assertAuthenticatedAs($user);
});

test('un utilisateur ne peut pas se connecter avec le mauvais pays', function () {
    $country = Country::factory()->create(['code' => 'FR', 'name' => 'France']);
    $otherCountry = Country::factory()->create(['code' => 'BE', 'name' => 'Belgique']);
    $user = User::factory()->create([
        'email' => 'test@example.com',
        'username' => 'testuser',
        'password' => Hash::make('password123'),
    ]);
    $user->countries()->attach($country);

    $response = $this->post('/login', [
        'country' => 'Belgique',
        'email' => 'testuser',
        'password' => 'password123',
    ]);

    $response->assertSessionHasErrors('email');
    $this->assertGuest();
});

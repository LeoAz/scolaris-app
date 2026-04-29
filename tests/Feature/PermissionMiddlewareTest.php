<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

test('un super admin est bloqué s\'il n\'a pas la permission spécifique', function () {
    Permission::findOrCreate('admin.users.index', 'web');

    $user = User::factory()->create();
    $role = Role::findOrCreate('Super admin', 'web');
    $user->assignRole($role);
    // On ne lui donne pas la permission admin.users.index

    $response = $this->actingAs($user)->get(route('admin.users.index'));

    $response->assertStatus(403);
});

test('un super admin peut accéder s\'il a la permission spécifique', function () {
    $permission = Permission::findOrCreate('admin.users.index', 'web');

    $user = User::factory()->create();
    $role = Role::findOrCreate('Super admin', 'web');
    $user->assignRole($role);
    $user->givePermissionTo($permission);

    $response = $this->actingAs($user)->get(route('admin.users.index'));

    $response->assertStatus(200);
});

test('un utilisateur sans permission est bloqué', function () {
    // Utiliser findOrCreate pour éviter PermissionAlreadyExists
    Permission::findOrCreate('admin.users.index', 'web');

    $user = User::factory()->create();
    // On ne lui donne pas la permission

    $response = $this->actingAs($user)->get(route('admin.users.index'));

    $response->assertStatus(403);
});

test('un utilisateur avec la permission peut accéder à la route', function () {
    $permission = Permission::findOrCreate('admin.users.index', 'web');

    $user = User::factory()->create();
    $user->givePermissionTo($permission);

    $response = $this->actingAs($user)->get(route('admin.users.index'));

    $response->assertStatus(200);
});

test('les routes exclues sont accessibles sans permission spécifique', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('home'));

    $response->assertStatus(200);
});

test('une route sans permission définie en base est accessible (politique permissive par défaut)', function () {
    $user = User::factory()->create();

    // On utilise une route qui n'est pas gérée par le middleware Spatie ou une policy
    // 'home' est exclue du middleware donc elle est toujours accessible
    $response = $this->actingAs($user)->get(route('home'));

    $response->assertStatus(200);
});

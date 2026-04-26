<?php

namespace Tests\Feature\Admin;

use App\Models\Country;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->create();
    $this->role = Role::create(['name' => 'Super admin']);
    $this->admin->assignRole($this->role);
});

test('admin can see countries list', function () {
    Country::create(['name' => 'Cameroun', 'code' => 'CM']);

    $response = $this->actingAs($this->admin)->get(route('admin.countries.index'));

    $response->assertStatus(200);
});

test('admin can create a country', function () {
    $response = $this->actingAs($this->admin)->post(route('admin.countries.store'), [
        'name' => 'Gabon',
        'code' => 'GA',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('countries', [
        'name' => 'Gabon',
        'code' => 'GA',
    ]);
});

test('admin can update a country', function () {
    $country = Country::create(['name' => 'Cameron', 'code' => 'CM']);

    $response = $this->actingAs($this->admin)->put(route('admin.countries.update', $country), [
        'name' => 'Cameroun',
        'code' => 'CM',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('countries', [
        'id' => $country->id,
        'name' => 'Cameroun',
        'code' => 'CM',
    ]);
});

test('admin can delete a country', function () {
    $country = Country::create(['name' => 'Sénégal', 'code' => 'SN']);

    $response = $this->actingAs($this->admin)->delete(route('admin.countries.destroy', $country));

    $response->assertRedirect();
    $this->assertSoftDeleted('countries', [
        'id' => $country->id,
    ]);
});

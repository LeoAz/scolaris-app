<?php

use App\Models\Country;
use App\Models\CreditRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

test('validator can login without selecting a country and see all requests', function () {
    // 1. Setup roles and users
    $validatorRole = Role::where('name', 'Validateur')->first() ?? Role::create(['name' => 'Validateur']);
    $validator = User::factory()->create();
    $validator->assignRole($validatorRole);

    $country1 = Country::factory()->create(['name' => 'Cameroun']);
    $country2 = Country::factory()->create(['name' => 'Gabon']);

    // 2. Create requests in different countries
    CreditRequest::factory()->create(['country_id' => $country1->id]);
    CreditRequest::factory()->create(['country_id' => $country2->id]);

    // 3. Login as validator without country (using 'all' or empty)
    $response = $this->post(route('login.store'), [
        'email' => $validator->email,
        'password' => 'password',
        'country' => 'all',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect('/credit/requests');

    // 4. Verify that session has no country selected
    $this->assertNull(session('selected_country_id'));

    // 5. Verify that validator sees both requests (scope should not apply)
    $this->actingAs($validator);
    $this->assertEquals(2, CreditRequest::count());
});

test('regular user cannot login without country', function () {
    $agentRole = Role::where('name', 'Agent')->first() ?? Role::create(['name' => 'Agent']);
    $agent = User::factory()->create();
    $agent->assignRole($agentRole);

    $country = Country::factory()->create(['name' => 'Cameroun']);
    $agent->countries()->attach($country);

    $response = $this->post(route('login.store'), [
        'email' => $agent->email,
        'password' => 'password',
        'country' => 'all',
    ]);

    $this->assertGuest();
});

test('regular user can only see requests from their selected country', function () {
    $agentRole = Role::where('name', 'Agent')->first() ?? Role::create(['name' => 'Agent']);
    $agent = User::factory()->create();
    $agent->assignRole($agentRole);

    $country1 = Country::factory()->create(['name' => 'Cameroun']);
    $country2 = Country::factory()->create(['name' => 'Gabon']);
    $agent->countries()->attach($country1);

    CreditRequest::factory()->create(['country_id' => $country1->id]);
    CreditRequest::factory()->create(['country_id' => $country2->id]);

    // Login with Cameroun
    $this->post(route('login.store'), [
        'email' => $agent->email,
        'password' => 'password',
        'country' => 'Cameroun',
    ]);

    $this->assertAuthenticated();
    $this->assertEquals($country1->id, session('selected_country_id'));

    // Should only see 1 request
    $this->assertEquals(1, CreditRequest::count());
});

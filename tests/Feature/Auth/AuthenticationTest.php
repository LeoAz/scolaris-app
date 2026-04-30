<?php

use App\Models\Country;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Laravel\Fortify\Features;

uses(RefreshDatabase::class);

test('login screen can be rendered', function () {
    Country::query()->delete();
    Country::factory()->create(['name' => 'Cameroun']);
    $response = $this->get(route('login'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('auth/login')
        ->has('countries')
        ->where('countries.0.name', 'Cameroun')
    );
});

test('users can authenticate using the login screen', function () {
    $country = Country::factory()->create(['name' => 'Cameroun']);
    $user = User::factory()->create();
    $user->countries()->attach($country);

    $response = $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
        'country' => 'Cameroun',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect('/credit/requests');
});

test('users with two factor enabled are redirected to two factor challenge', function () {
    $this->skipUnlessFortifyHas(Features::twoFactorAuthentication());

    Features::twoFactorAuthentication([
        'confirm' => true,
        'confirmPassword' => true,
    ]);

    $country = Country::factory()->create(['name' => 'Cameroun']);
    $user = User::factory()->create();
    $user->countries()->attach($country);

    $user->forceFill([
        'two_factor_secret' => encrypt('test-secret'),
        'two_factor_recovery_codes' => encrypt(json_encode(['code1', 'code2'])),
        'two_factor_confirmed_at' => now(),
    ])->save();

    $response = $this->post(route('login'), [
        'email' => $user->email,
        'password' => 'password',
        'country' => 'Cameroun',
    ]);

    $response->assertRedirect(route('two-factor.login'));
    $response->assertSessionHas('login.id', $user->id);
    $this->assertGuest();
});

test('users can not authenticate with invalid password', function () {
    $country = Country::factory()->create(['name' => 'Cameroun']);
    $user = User::factory()->create();
    $user->countries()->attach($country);

    $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'wrong-password',
        'country' => 'Cameroun',
    ]);

    $this->assertGuest();
});

test('users can logout', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('logout'));

    $this->assertGuest();
    $response->assertRedirect(route('home'));
});

test('users are rate limited', function () {
    $country = Country::factory()->create(['name' => 'Cameroun']);
    $user = User::factory()->create();
    $user->countries()->attach($country);

    $throttleKey = Str::transliterate(Str::lower($user->email).'|Cameroun|127.0.0.1');
    RateLimiter::clear($throttleKey);

    for ($i = 0; $i < 5; $i++) {
        $this->post(route('login.store'), [
            'email' => $user->email,
            'password' => 'wrong-password',
            'country' => 'Cameroun',
        ]);
    }

    $response = $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'wrong-password',
        'country' => 'Cameroun',
    ]);

    $response->assertTooManyRequests();
});

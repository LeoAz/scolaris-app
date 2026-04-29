<?php

use App\Models\Stakeholder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

use function Pest\Laravel\actingAs;

uses(RefreshDatabase::class);

test('students list is accessible', function () {
    $user = User::factory()->create();

    Stakeholder::factory()->create(['type' => 'student']);

    actingAs($user)
        ->get(route('stakeholders.students'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('stakeholders/index')
            ->has('stakeholders.data', 1)
            ->where('type', 'student')
        );
});

test('guarantors list is accessible', function () {
    $user = User::factory()->create();

    Stakeholder::factory()->create(['type' => 'guarantor']);

    actingAs($user)
        ->get(route('stakeholders.guarantors'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('stakeholders/index')
            ->has('stakeholders.data', 1)
            ->where('type', 'guarantor')
        );
});

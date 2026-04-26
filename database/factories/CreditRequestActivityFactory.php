<?php

namespace Database\Factories;

use App\Models\CreditRequest;
use App\Models\CreditRequestActivity;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CreditRequestActivity>
 */
class CreditRequestActivityFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'credit_request_id' => CreditRequest::factory(),
            'user_id' => User::factory(),
            'action' => $this->faker->randomElement(['soumettre', 'valider', 'rejeter', 'cloturer', 'resilier', 'document_added', 'document_deleted']),
            'description' => $this->faker->sentence(),
            'properties' => [],
        ];
    }
}

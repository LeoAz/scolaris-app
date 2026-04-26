<?php

namespace Database\Factories;

use App\Models\LoanTerminationRequest;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LoanTerminationRequest>
 */
class LoanTerminationRequestFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'credit_request_id' => \App\Models\CreditRequest::factory(),
            'user_id' => \App\Models\User::factory(),
            'requested_date' => $this->faker->date(),
            'reason' => $this->faker->sentence(),
            'description' => $this->faker->paragraph(),
            'status' => 'pending',
        ];
    }
}

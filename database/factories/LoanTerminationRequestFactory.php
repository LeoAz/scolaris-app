<?php

namespace Database\Factories;

use App\Models\CreditRequest;
use App\Models\LoanTerminationRequest;
use App\Models\User;
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
            'credit_request_id' => CreditRequest::factory(),
            'user_id' => User::factory(),
            'requested_date' => $this->faker->date(),
            'reason' => $this->faker->sentence(),
            'description' => $this->faker->paragraph(),
            'status' => 'pending',
        ];
    }
}

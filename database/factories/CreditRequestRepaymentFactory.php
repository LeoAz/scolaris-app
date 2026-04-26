<?php

namespace Database\Factories;

use App\Models\CreditRequestRepayment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CreditRequestRepayment>
 */
class CreditRequestRepaymentFactory extends Factory
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
            'amount' => $this->faker->randomFloat(2, 100, 1000),
            'repayment_date' => $this->faker->date(),
            'payment_method' => 'cash',
            'status' => 'validated',
        ];
    }
}

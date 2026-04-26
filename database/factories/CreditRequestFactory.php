<?php

namespace Database\Factories;

use App\Enums\CreditRequestStatus;
use App\Models\Country;
use App\Models\CreditRequest;
use App\Models\CreditType;
use App\Models\Stakeholder;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CreditRequest>
 */
class CreditRequestFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $code = 'CR-'.$this->faker->unique()->numberBetween(10000, 99999);

        return [
            'code' => $code,
            'credit_type_id' => CreditType::factory(),
            'student_id' => Stakeholder::factory()->student(),
            'guarantor_id' => Stakeholder::factory()->guarantor(),
            'created_by_id' => User::factory(),
            'country_id' => Country::first() ?? Country::factory(),
            'amount_requested' => $this->faker->randomFloat(2, 1000, 50000),
            'initial_contribution' => $this->faker->randomFloat(2, 0, 5000),
            'status' => CreditRequestStatus::CREATION,
            'searchable' => $code,
        ];
    }
}

<?php

namespace Database\Factories;

use App\Models\CreditType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CreditType>
 */
class CreditTypeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = $this->faker->unique()->words(3, true);

        return [
            'name' => $name,
            'description' => $this->faker->sentence(),
            'rate' => $this->faker->randomFloat(2, 1, 15),
            'duration_months' => $this->faker->numberBetween(6, 60),
            'searchable' => $name,
        ];
    }
}

<?php

namespace Database\Factories;

use App\Models\Stakeholder;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Stakeholder>
 */
class StakeholderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $firstName = $this->faker->firstName();
        $lastName = $this->faker->lastName();

        return [
            'type' => $this->faker->randomElement(['student', 'guarantor']),
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $this->faker->unique()->safeEmail(),
            'whatsapp_number' => $this->faker->phoneNumber(),
            'other_number' => $this->faker->phoneNumber(),
            'address' => $this->faker->address(),
            'profession' => $this->faker->jobTitle(),
            'amplitude_account_number' => $this->faker->numerify('##########'),
            'searchable' => "{$firstName} {$lastName}",
        ];
    }

    public function student(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'student',
        ]);
    }

    public function guarantor(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'guarantor',
        ]);
    }
}

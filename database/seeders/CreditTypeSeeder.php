<?php

namespace Database\Seeders;

use App\Models\CreditType;
use Illuminate\Database\Seeder;

class CreditTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        CreditType::create([
            'name' => 'Prêt Étudiant Classique',
            'description' => 'Un prêt pour financer vos études avec un taux avantageux.',
            'rate' => 2.5,
            'duration_months' => 36,
        ]);

        CreditType::create([
            'name' => 'Prêt Ordinateur',
            'description' => 'Financement pour l\'achat de matériel informatique.',
            'rate' => 1.8,
            'duration_months' => 12,
        ]);

        CreditType::create([
            'name' => 'Frais de Scolarité Élevés',
            'description' => 'Pour les écoles de commerce et d\'ingénieur.',
            'rate' => 3.0,
            'duration_months' => 48,
        ]);
    }
}

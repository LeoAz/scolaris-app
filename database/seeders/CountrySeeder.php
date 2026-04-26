<?php

namespace Database\Seeders;

use App\Models\Country;
use Illuminate\Database\Seeder;

class CountrySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Country::insert([
            ['code' => 'CM', 'name' => 'Cameroun', 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'CI', 'name' => 'Côte d\'Ivoire', 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'SN', 'name' => 'Sénégal', 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'GA', 'name' => 'Gabon', 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'CD', 'name' => 'Congo (RDC)', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}

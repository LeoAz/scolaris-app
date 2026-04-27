<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $countries = [
            ['name' => 'Mali', 'code' => 'ML'],
            ['name' => 'Sénégal', 'code' => 'SN'],
            ['name' => 'Côte d\'Ivoire', 'code' => 'CI'],
            ['name' => 'Burkina Faso', 'code' => 'BF'],
            ['name' => 'Kenya', 'code' => 'KE'],
            ['name' => 'Togo', 'code' => 'TG'],
            ['name' => 'Bénin', 'code' => 'BJ'],
        ];

        foreach ($countries as $country) {
            DB::table('countries')->updateOrInsert(
                ['code' => $country['code']],
                ['name' => $country['name'], 'created_at' => now(), 'updated_at' => now()]
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $codes = ['ML', 'SN', 'CI', 'BF', 'KE', 'TG', 'BJ'];
        DB::table('countries')->whereIn('code', $codes)->delete();
    }
};

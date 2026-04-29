<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Role::firstOrCreate(['name' => 'Super Administrateur', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'Administrateur', 'guard_name' => 'web']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Role::whereIn('name', ['Super Administrateur', 'Administrateur'])->delete();
    }
};

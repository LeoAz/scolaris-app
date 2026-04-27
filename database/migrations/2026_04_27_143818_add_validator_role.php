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
        Role::firstOrCreate(['name' => 'Validateur']);
    }

    public function down(): void
    {
        Role::where('name', 'Validateur')->delete();
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $superAdmin = \Spatie\Permission\Models\Role::where('name', 'Super admin')->first();
        if ($superAdmin) {
            $superAdmin->syncPermissions(\Spatie\Permission\Models\Permission::all());
        }

        $admin = \Spatie\Permission\Models\Role::where('name', 'Administrateur')->first();
        if ($admin) {
            $admin->syncPermissions(\Spatie\Permission\Models\Permission::where('name', 'like', 'admin.%')
                ->orWhere('name', 'dashboard')
                ->orWhere('name', 'like', 'profile.%')
                ->get());
        }

        $controller = \Spatie\Permission\Models\Role::where('name', 'Controlleur (Dossier)')->first();
        if ($controller) {
            $controller->syncPermissions(\Spatie\Permission\Models\Permission::where('name', 'like', 'credit.%')
                ->where('name', 'not like', '%.destroy')
                ->orWhere('name', 'dashboard')
                ->get());
        }

        $recouvrement = \Spatie\Permission\Models\Role::where('name', 'Recouvrement')->first();
        if ($recouvrement) {
            $recouvrement->syncPermissions(\Spatie\Permission\Models\Permission::where('name', 'like', 'credit.recovery.%')
                ->orWhere('name', 'dashboard')
                ->get());
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No easy way to rollback unless we store previous states
    }
};

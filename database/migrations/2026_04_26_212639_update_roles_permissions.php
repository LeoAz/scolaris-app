<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $superAdmin = Role::where('name', 'Super admin')->first();
        if ($superAdmin) {
            $superAdmin->syncPermissions(Permission::all());
        }

        $admin = Role::where('name', 'Administrateur')->first();
        if ($admin) {
            $admin->syncPermissions(Permission::where('name', 'like', 'admin.%')
                ->orWhere('name', 'dashboard')
                ->orWhere('name', 'like', 'profile.%')
                ->get());
        }

        $controller = Role::where('name', 'Controlleur (Dossier)')->first();
        if ($controller) {
            $controller->syncPermissions(Permission::where('name', 'like', 'credit.%')
                ->where('name', 'not like', '%.destroy')
                ->orWhere('name', 'dashboard')
                ->get());
        }

        $recouvrement = Role::where('name', 'Recouvrement')->first();
        if ($recouvrement) {
            $recouvrement->syncPermissions(Permission::where('name', 'like', 'credit.recovery.%')
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

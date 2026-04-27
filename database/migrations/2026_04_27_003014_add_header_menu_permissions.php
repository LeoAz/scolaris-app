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
        $menuPermissions = [
            'menu.administration' => [
                'group' => 'Menu',
                'description' => 'Afficher le menu Administration dans le header',
            ],
            'menu.gestion_dossiers' => [
                'group' => 'Menu',
                'description' => 'Afficher le menu Gestion des dossiers dans le header',
            ],
            'menu.stakeholders' => [
                'group' => 'Menu',
                'description' => 'Afficher le menu Etudiants & garants dans le header',
            ],
            'menu.recovery' => [
                'group' => 'Menu',
                'description' => 'Afficher le menu Recouvrement dans le header',
            ],
            'menu.termination' => [
                'group' => 'Menu',
                'description' => 'Afficher le menu Résiliation dans le header',
            ],
            'menu.reports' => [
                'group' => 'Menu',
                'description' => 'Afficher le menu Rapport dans le header',
            ],
        ];

        foreach ($menuPermissions as $name => $data) {
            Permission::updateOrCreate(
                ['name' => $name, 'guard_name' => 'web'],
                [
                    'group' => $data['group'],
                    'description' => $data['description'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        // Assign permissions to roles
        $superAdmin = Role::where('name', 'Super admin')->first();
        if ($superAdmin) {
            $superAdmin->givePermissionTo(array_keys($menuPermissions));
        }

        $admin = Role::where('name', 'Administrateur')->first();
        if ($admin) {
            $admin->givePermissionTo(array_keys($menuPermissions));
        }

        $controller = Role::where('name', 'Controlleur (Dossier)')->first();
        if ($controller) {
            $controller->givePermissionTo(['menu.gestion_dossiers', 'menu.stakeholders', 'menu.reports']);
        }

        $recouvrement = Role::where('name', 'Recouvrement')->first();
        if ($recouvrement) {
            $recouvrement->givePermissionTo(['menu.recovery', 'menu.reports']);
        }

        $agent = Role::where('name', 'Agent')->first();
        if ($agent) {
            $agent->givePermissionTo(['menu.gestion_dossiers', 'menu.stakeholders']);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $names = [
            'menu.administration',
            'menu.gestion_dossiers',
            'menu.stakeholders',
            'menu.recovery',
            'menu.termination',
            'menu.reports',
        ];

        Permission::whereIn('name', $names)->delete();
    }
};

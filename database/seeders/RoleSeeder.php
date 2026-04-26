<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            'Super admin' => 'Accès total et illimité à toutes les fonctionnalités du système.',
            'Administrateur' => 'Gestion complète des utilisateurs, rôles et paramètres de l\'application.',
            'Controlleur (Dossier)' => 'Responsable de la vérification et de la validation des dossiers de prêt.',
            'Recouvrement' => 'Gestion du suivi des remboursements et des actions de recouvrement.',
            'Agent' => 'Saisie des dossiers et accompagnement des étudiants.',
            'Utilisateur' => 'Accès standard aux fonctionnalités de consultation.',
        ];

        foreach ($roles as $name => $description) {
            Role::updateOrCreate(
                ['name' => $name],
                ['description' => $description]
            );
        }
    }
}

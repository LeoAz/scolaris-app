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
        $descriptions = [
            'admin.activities.index' => 'Voir le journal des activités système',
            'admin.countries.index' => 'Voir la liste des pays',
            'admin.countries.store' => 'Ajouter un nouveau pays',
            'admin.countries.update' => 'Modifier un pays existant',
            'admin.countries.destroy' => 'Supprimer un pays',
            'admin.credit-types.index' => 'Voir les types de crédit',
            'admin.credit-types.store' => 'Créer un nouveau type de crédit',
            'admin.credit-types.update' => 'Modifier un type de crédit',
            'admin.credit-types.destroy' => 'Supprimer un type de crédit',
            'admin.permissions.index' => 'Voir la liste des permissions',
            'admin.roles.index' => 'Voir la liste des rôles',
            'admin.roles.store' => 'Créer un nouveau rôle',
            'admin.roles.update' => 'Modifier un rôle existant',
            'admin.roles.destroy' => 'Supprimer un rôle',
            'admin.users.index' => 'Voir la liste des utilisateurs',
            'admin.users.store' => 'Créer un nouvel utilisateur',
            'admin.users.update' => 'Modifier un utilisateur existant',
            'admin.users.destroy' => 'Supprimer un utilisateur',
            'credit.guarantors.search' => 'Rechercher des garants',
            'credit.recovery.index' => 'Voir la gestion des recouvrements',
            'credit.recovery.record' => 'Enregistrer un paiement de recouvrement',
            'credit.recovery.reject' => 'Rejeter un paiement de recouvrement',
            'credit.recovery.validate' => 'Valider un paiement de recouvrement',
            'credit.index' => 'Voir la liste des crédits',
            'credit.store' => 'Enregistrer une nouvelle demande de crédit',
            'credit.create' => 'Accéder au formulaire de création de crédit',
            'credit.show' => 'Voir les détails d\'un crédit',
            'credit.update' => 'Modifier une demande de crédit',
            'credit.destroy' => 'Supprimer une demande de crédit',
            'credit.documents.upload' => 'Télécharger des documents pour un crédit',
            'credit.documents.destroy' => 'Supprimer des documents de crédit',
            'credit.edit' => 'Modifier un crédit existant',
            'credit.installments.index' => 'Voir les échéances d\'un crédit',
            'credit.installments.repayments.store' => 'Enregistrer un remboursement d\'échéance',
            'credit.reject' => 'Rejeter une demande de crédit',
            'credit.repayments.reject' => 'Rejeter un remboursement',
            'credit.repayments.validate' => 'Valider un remboursement',
            'credit.resiliate' => 'Résilier un contrat de crédit',
            'credit.submit' => 'Soumettre une demande de crédit pour validation',
            'credit.summary' => 'Voir le résumé d\'une demande de crédit',
            'credit.termination-request.store' => 'Enregistrer une demande de résiliation',
            'credit.termination-request.create' => 'Créer une demande de résiliation',
            'credit.validate' => 'Valider définitivement un crédit',
            'credit.termination-requests.index' => 'Voir les demandes de résiliation',
            'credit.termination-requests.show' => 'Détails d\'une demande de résiliation',
            'credit.termination-requests.approve' => 'Approuver une résiliation',
            'credit.termination-requests.reject' => 'Rejeter une résiliation',
            'dashboard' => 'Accéder au tableau de bord principal',
            'notifications.index' => 'Voir ses notifications',
            'notifications.mark-all-as-read' => 'Marquer toutes les notifications comme lues',
            'notifications.mark-as-read' => 'Marquer une notification comme lue',
            'user-password.update' => 'Modifier son mot de passe',
            'profile.edit' => 'Accéder à l\'édition de son profil',
            'profile.update' => 'Mettre à jour ses informations de profil',
            'profile.destroy' => 'Supprimer son compte utilisateur',
            'security.edit' => 'Gérer ses paramètres de sécurité',
            'stakeholders.guarantors' => 'Gérer les garants (parties prenantes)',
            'stakeholders.students' => 'Gérer les étudiants (parties prenantes)',
        ];

        foreach ($descriptions as $name => $description) {
            DB::table('permissions')
                ->where('name', $name)
                ->update(['description' => $description]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('permissions')->update(['description' => null]);
    }
};

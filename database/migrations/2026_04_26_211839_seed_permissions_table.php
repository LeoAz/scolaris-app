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
        $permissions = [
            'admin.activities.index',
            'admin.countries.index',
            'admin.countries.store',
            'admin.countries.update',
            'admin.countries.destroy',
            'admin.credit-types.index',
            'admin.credit-types.store',
            'admin.credit-types.update',
            'admin.credit-types.destroy',
            'admin.permissions.index',
            'admin.roles.index',
            'admin.roles.store',
            'admin.roles.update',
            'admin.roles.destroy',
            'admin.users.index',
            'admin.users.store',
            'admin.users.update',
            'admin.users.destroy',
            'credit.guarantors.search',
            'credit.recovery.index',
            'credit.recovery.record',
            'credit.recovery.reject',
            'credit.recovery.validate',
            'credit.index',
            'credit.store',
            'credit.create',
            'credit.show',
            'credit.update',
            'credit.destroy',
            'credit.documents.upload',
            'credit.documents.destroy',
            'credit.edit',
            'credit.installments.index',
            'credit.installments.repayments.store',
            'credit.reject',
            'credit.repayments.reject',
            'credit.repayments.validate',
            'credit.resiliate',
            'credit.submit',
            'credit.summary',
            'credit.termination-request.store',
            'credit.termination-request.create',
            'credit.validate',
            'credit.termination-requests.index',
            'credit.termination-requests.show',
            'credit.termination-requests.approve',
            'credit.termination-requests.reject',
            'dashboard',
            'notifications.index',
            'notifications.mark-all-as-read',
            'notifications.mark-as-read',
            'user-password.update',
            'profile.edit',
            'profile.update',
            'profile.destroy',
            'security.edit',
            'stakeholders.guarantors',
            'stakeholders.students',
        ];

        foreach ($permissions as $permission) {
            DB::table('permissions')->updateOrInsert(
                ['name' => $permission, 'guard_name' => 'web'],
                ['created_at' => now(), 'updated_at' => now()]
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $permissions = [
            'admin.activities.index',
            'admin.countries.index',
            'admin.countries.store',
            'admin.countries.update',
            'admin.countries.destroy',
            'admin.credit-types.index',
            'admin.credit-types.store',
            'admin.credit-types.update',
            'admin.credit-types.destroy',
            'admin.permissions.index',
            'admin.roles.index',
            'admin.roles.store',
            'admin.roles.update',
            'admin.roles.destroy',
            'admin.users.index',
            'admin.users.store',
            'admin.users.update',
            'admin.users.destroy',
            'credit.guarantors.search',
            'credit.recovery.index',
            'credit.recovery.record',
            'credit.recovery.reject',
            'credit.recovery.validate',
            'credit.index',
            'credit.store',
            'credit.create',
            'credit.show',
            'credit.update',
            'credit.destroy',
            'credit.documents.upload',
            'credit.documents.destroy',
            'credit.edit',
            'credit.installments.index',
            'credit.installments.repayments.store',
            'credit.reject',
            'credit.repayments.reject',
            'credit.repayments.validate',
            'credit.resiliate',
            'credit.submit',
            'credit.summary',
            'credit.termination-request.store',
            'credit.termination-request.create',
            'credit.validate',
            'credit.termination-requests.index',
            'credit.termination-requests.show',
            'credit.termination-requests.approve',
            'credit.termination-requests.reject',
            'dashboard',
            'notifications.index',
            'notifications.mark-all-as-read',
            'notifications.mark-as-read',
            'user-password.update',
            'profile.edit',
            'profile.update',
            'profile.destroy',
            'security.edit',
            'stakeholders.guarantors',
            'stakeholders.students',
        ];

        DB::table('permissions')
            ->whereIn('name', $permissions)
            ->delete();
    }
};

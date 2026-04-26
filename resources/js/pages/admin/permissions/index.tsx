import { Head, router } from '@inertiajs/react';
import * as React from 'react';

import { DataTable } from '@/components/admin/data-table';
import AdminLayout from '@/layouts/admin/admin-layout';
import { index as adminPermissionsIndex } from '@/routes/admin/permissions';
import { index as adminUsersIndex } from '@/routes/admin/users';

interface Permission {
    id: number;
    name: string;
}

interface Props {
    permissions: {
        data: Permission[];
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
        links: any[];
    };
    filters: { search?: string };
}

export default function PermissionIndex({ permissions, filters }: Props) {
    const handleSearch = (search: string) => {
        router.get(adminPermissionsIndex().url, { ...filters, search }, { preserveState: true, replace: true });
    };

    const columns = [
        { header: 'ID', accessorKey: 'id' },
        { header: 'Nom', accessorKey: 'name' },
        { header: 'Guard', accessorKey: 'guard_name' },
    ];

    const breadcrumbs = [
        { title: 'Administration', href: adminUsersIndex().url },
        { title: 'Permissions', href: adminPermissionsIndex().url },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Gestion des Permissions" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Permissions</h2>
                        <p className="text-muted-foreground">Consultez les permissions disponibles dans le système.</p>
                    </div>
                </div>

                <DataTable
                    data={permissions.data}
                    columns={columns}
                    meta={permissions}
                    onSearch={handleSearch}
                />
            </div>
        </AdminLayout>
    );
}

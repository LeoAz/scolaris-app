import { Head, router } from '@inertiajs/react';
import * as React from 'react';

import { DataTable } from '@/components/admin/data-table';
import AdminLayout from '@/layouts/admin/admin-layout';
import { index as adminActivitiesIndex } from '@/routes/admin/activities';
import { index as adminUsersIndex } from '@/routes/admin/users';

interface Props {
    filters: { search?: string };
}

export default function ActivityIndex({ filters }: Props) {
    const handleSearch = (search: string) => {
        router.get(adminActivitiesIndex().url, { ...filters, search }, { preserveState: true, replace: true });
    };

    const breadcrumbs = [
        { title: 'Administration', href: adminUsersIndex().url },
        { title: 'Activités', href: adminActivitiesIndex().url },
    ];

    const columns = [
        { header: 'Action', accessorKey: 'action' },
        { header: 'Utilisateur', accessorKey: 'user' },
        { header: 'Date', accessorKey: 'date' },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Journal d'activités" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Activités</h2>
                        <p className="text-muted-foreground">Journal des actions effectuées dans le système.</p>
                    </div>
                </div>

                <DataTable
                    data={[]}
                    columns={columns}
                    meta={{ current_page: 1, last_page: 1, from: 0, to: 0, total: 0, links: [] }}
                    onSearch={handleSearch}
                />

                <div className="mt-4 flex h-[200px] items-center justify-center rounded-lg border border-dashed">
                    <div className="text-center">
                        <h3 className="text-lg font-medium">Données réelles bientôt disponibles</h3>
                        <p className="text-sm text-muted-foreground">L'intégration des activités est en cours.</p>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

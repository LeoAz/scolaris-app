import { Head, Link, router } from '@inertiajs/react';
import { User, Users, Mail, Phone, ExternalLink } from 'lucide-react';
import React, { Suspense } from 'react';

import { DataTable } from '@/components/admin/data-table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { index as creditIndex } from '@/routes/credit';
import { students, guarantors } from '@/routes/stakeholders';

const AppLayout = React.lazy(() => import('@/layouts/app-layout'));

interface CreditRequest {
    id: number;
    code: string;
}

interface Stakeholder {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    whatsapp_number: string;
    student_credit_requests?: CreditRequest[];
    guarantor_credit_requests?: CreditRequest[];
}

interface PaginatedStakeholders {
    data: Stakeholder[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
    from: number;
    to: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    stakeholders: PaginatedStakeholders;
    type: 'student' | 'guarantor';
    filters: {
        search?: string;
    };
}

export default function StakeholdersIndex({ stakeholders, type, filters }: Props) {
    const handleSearch = (search: string) => {
        router.get(
            type === 'student' ? students().url : guarantors().url,
            { ...filters, search, page: 1 },
            { preserveState: true, replace: true }
        );
    };

    const columns = [
        {
            header: 'Nom complet',
            accessorKey: 'name',
            cell: (item: Stakeholder) => (
                <div className="font-medium text-foreground">
                    {item.last_name} {item.first_name}
                </div>
            )
        },
        {
            header: 'Email',
            accessorKey: 'email',
            cell: (item: Stakeholder) => (
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 opacity-50" />
                    <span className="text-xs">{item.email}</span>
                </div>
            )
        },
        {
            header: 'WhatsApp',
            accessorKey: 'whatsapp_number',
            cell: (item: Stakeholder) => (
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 opacity-50" />
                    <span className="text-xs font-mono">{item.whatsapp_number}</span>
                </div>
            )
        },
        {
            header: 'Dossiers',
            accessorKey: 'credit_requests',
            cell: (item: Stakeholder) => {
                const requests = type === 'student' ? item.student_credit_requests : item.guarantor_credit_requests;

                if (!requests || requests.length === 0) {
                    return <span className="text-[10px] text-muted-foreground italic">Aucun dossier</span>;
                }

                return (
                    <div className="flex flex-wrap gap-1">
                        {requests.map((req) => (
                            <Badge
                                key={req.id}
                                variant="secondary"
                                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors h-5 px-1.5 text-[10px]"
                                onClick={() => router.get(creditIndex({ search: req.code }).url)}
                            >
                                {req.code}
                                <ExternalLink className="ml-1 h-2 w-2" />
                            </Badge>
                        ))}
                    </div>
                );
            }
        }
    ];

    const menuItems = [
        {
            label: 'Étudiants',
            value: 'student',
            icon: Users,
            href: students().url,
        },
        {
            label: 'Garants',
            value: 'guarantor',
            icon: User,
            href: guarantors().url,
        },
    ];

    return (
        <>
            <Head title={type === 'student' ? 'Étudiants' : 'Garants'} />

            <div className="flex flex-col md:flex-row gap-8 h-full py-6">
                {/* Sidebar */}
                <aside className="w-full md:w-72 flex-none">
                    <div className="sticky top-4 space-y-4">
                        <div className="px-3 py-2">
                            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-foreground/70 uppercase text-[10px]">
                                Menu
                            </h2>
                            <div className="space-y-1">
                                {menuItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = type === item.value;

                                    return (
                                        <Link
                                            key={item.value}
                                            href={item.href}
                                            className={cn(
                                                "group flex items-center justify-between rounded-md px-4 py-2.5 text-sm font-medium transition-all duration-200",
                                                isActive
                                                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon className={cn(
                                                    "h-4 w-4 transition-transform duration-200 group-hover:scale-110",
                                                    isActive ? "text-primary-foreground" : "text-muted-foreground"
                                                )} />
                                                {item.label}
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 min-w-0 space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Liste des {type === 'student' ? 'étudiants' : 'garants'}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {stakeholders.total} {type === 'student' ? 'étudiant' : 'garant'}
                            {stakeholders.total !== 1 ? 's' : ''} au total
                        </p>
                    </div>

                    <DataTable
                        data={stakeholders.data}
                        columns={columns}
                        meta={stakeholders}
                        onSearch={handleSearch}
                    />
                </main>
            </div>
        </>
    );
}

StakeholdersIndex.layout = (page: React.ReactNode) => {
    const type = (page as any)?.props?.type;
    const breadcrumbs = [
        { title: 'Tableau de bord', href: '/dashboard' },
        { title: type === 'student' ? 'Étudiants' : 'Garants', href: '#' },
    ];

    return (
        <Suspense fallback={null}>
            <AppLayout breadcrumbs={breadcrumbs}>
                {page}
            </AppLayout>
        </Suspense>
    );
};

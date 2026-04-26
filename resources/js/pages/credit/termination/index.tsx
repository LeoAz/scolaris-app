import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckCircle2, Clock, Search, XCircle, Eye } from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import CreditLayout from '@/layouts/credit/credit-layout';
import { cn } from '@/lib/utils';
import terminationRequests from '@/routes/credit/termination-requests/index';
import type { BreadcrumbItem } from '@/types';

interface TerminationRequest {
    id: number;
    requested_date: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    user: {
        name: string;
    };
    credit_request: {
        id: number;
        code: string;
        student: {
            first_name: string;
            last_name: string;
        };
    };
}

interface IndexProps {
    requests: {
        data: TerminationRequest[];
        links: any[];
    };
    breadcrumbs: BreadcrumbItem[];
}

const statusConfig = {
    pending: {
        label: 'En attente',
        className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
        icon: Clock,
    },
    approved: {
        label: 'Approuvée',
        className: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
        icon: CheckCircle2,
    },
    rejected: {
        label: 'Rejetée',
        className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
        icon: XCircle,
    },
};

export default function Index({ requests, breadcrumbs }: IndexProps) {
    const [searchTerm, setSearchTerm] = React.useState('');

    const formatDate = (dateString: string) => {
        return format(new Date(dateString), 'dd MMM yyyy', { locale: fr });
    };

    const filteredRequests = requests.data.filter(
        (r) =>
            r.credit_request.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            `${r.credit_request.student.first_name} ${r.credit_request.student.last_name}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase()),
    );

    return (
        <CreditLayout breadcrumbs={breadcrumbs} hideSidebar>
            <Head title="Demandes de résiliation" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Demandes de résiliation</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Liste et suivi des demandes de résiliation de dossiers de prêt.
                    </p>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher un dossier ou étudiant..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-9 pl-9"
                        />
                    </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-border/30 bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/40 hover:bg-muted/40">
                                <TableHead className="font-semibold">Dossier</TableHead>
                                <TableHead className="font-semibold">Étudiant</TableHead>
                                <TableHead className="font-semibold">Date demandée</TableHead>
                                <TableHead className="font-semibold">Motif</TableHead>
                                <TableHead className="font-semibold">Statut</TableHead>
                                <TableHead className="text-right font-semibold">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRequests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center">
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <Clock className="h-8 w-8 opacity-20" />
                                            <p className="text-sm">Aucune demande trouvée.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRequests.map((request) => {
                                    const status = statusConfig[request.status];
                                    const StatusIcon = status.icon;

                                    return (
                                        <TableRow key={request.id} className="group transition-colors hover:bg-muted/30">
                                            <TableCell className="font-medium">{request.credit_request.code}</TableCell>
                                            <TableCell>
                                                {request.credit_request.student.first_name}{' '}
                                                {request.credit_request.student.last_name}
                                            </TableCell>
                                            <TableCell>{formatDate(request.requested_date)}</TableCell>
                                            <TableCell className="max-w-[200px] truncate" title={request.reason}>
                                                {request.reason}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={cn('flex w-fit items-center gap-1 px-2 py-0.5 text-[11px] font-medium', status.className)}
                                                >
                                                    <StatusIcon className="h-3 w-3" />
                                                    {status.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => router.get(terminationRequests.show({ loanTerminationRequest: request.id }).url)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    <span className="sr-only">Voir</span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </CreditLayout>
    );
}

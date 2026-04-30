import { Head, router } from '@inertiajs/react';
import { debounce } from 'lodash-es';
import { Plus } from 'lucide-react';
import React, { useMemo, useState, Suspense } from 'react';

import { CreditCard } from '@/components/credit/credit-card';
import { CreditListEmpty } from '@/components/credit/credit-list-empty';
import { CreditListFilters } from '@/components/credit/credit-list-filters';
import { usePermission } from '@/hooks/use-permission';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { index as creditIndex, show as creditShow, destroy as creditDestroy, create as creditCreate, edit as creditEdit } from '@/routes/credit';
import type { BreadcrumbItem, Country, CreditRequest } from '@/types';

const CreditLayout = React.lazy(() => import('@/layouts/credit/credit-layout'));

interface IndexProps {
    creditRequests: {
        data: CreditRequest[];
        links: any[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    countries: Country[];
    filters: {
        status?: string;
        search?: string;
        country_id?: string;
        date_start?: string;
        date_end?: string;
    };
    breadcrumbs: BreadcrumbItem[];
}

export default function Index({
    creditRequests,
    countries,
    filters,
    breadcrumbs,
}: IndexProps) {
    const { hasPermission } = usePermission();
    const [params, setParams] = useState(filters);
    const [requestToDelete, setRequestToDelete] = useState<CreditRequest | null>(null);

    const updateFilters = (newParams: any) => {
        router.get(creditIndex().url, newParams, {
            preserveState: false,
            replace: true,
        });
    };

    const debouncedUpdateFilters = useMemo(
        () => debounce((newParams: any) => updateFilters(newParams), 300),
        [],
    );

    const handleSearchChange = (value: string) => {
        const newParams = { ...params, search: value };
        setParams(newParams);
        debouncedUpdateFilters(newParams);
    };

    const handleCountryChange = (value: string) => {
        const countryId = value === 'all' ? undefined : value;
        const newParams = { ...params, country_id: countryId };
        setParams(newParams);
        updateFilters(newParams);
    };

    const handleView = (request: CreditRequest) => {
        router.get(creditShow({ creditRequest: request.id }).url);
    };

    const handleCreate = () => {
        router.get(creditCreate().url);
    };

    const handleEdit = (request: CreditRequest) => {
        router.get(creditEdit({ creditRequest: request.id }).url);
    };

    const handleDelete = (request: CreditRequest) => {
        setRequestToDelete(request);
    };

    const confirmDelete = () => {
        if (requestToDelete) {
            router.delete(creditDestroy({ creditRequest: requestToDelete.id }).url, {
                onSuccess: () => setRequestToDelete(null),
            });
        }
    };

    return (
        <Suspense fallback={null}>
            <CreditLayout
                breadcrumbs={breadcrumbs}
            >
                <Head title="Gestion des dossiers" />

                <div className="space-y-6">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                Dossiers de prêt
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {creditRequests.total} dossier
                                {creditRequests.total !== 1 ? 's' : ''} au total
                            </p>
                        </div>
                        {hasPermission('credit.create') && (
                            <Button className="h-8 rounded-lg px-4 font-medium shadow-sm" onClick={handleCreate}>
                                <Plus className="mr-2 h-4 w-4" />
                                Nouveau dossier
                            </Button>
                        )}
                    </div>

                    <CreditListFilters
                        search={params.search || ''}
                        countryId={params.country_id || 'all'}
                        countries={countries}
                        onSearchChange={handleSearchChange}
                        onCountryChange={handleCountryChange}
                    />

                    <div className="flex flex-col gap-4">
                        {creditRequests.data.length > 0 ? (
                            creditRequests.data.map((request) => (
                                <CreditCard
                                    key={request.id}
                                    request={request}
                                    onView={handleView}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            ))
                        ) : (
                            <div className="col-span-full">
                                <CreditListEmpty />
                            </div>
                        )}
                    </div>

                    {creditRequests.total > creditRequests.per_page && (
                        <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
                            <div className="text-sm text-muted-foreground">
                                Affichage de{' '}
                                <span className="font-medium text-foreground">
                                    {(creditRequests.current_page - 1) *
                                        creditRequests.per_page +
                                        1}
                                </span>{' '}
                                à{' '}
                                <span className="font-medium text-foreground">
                                    {Math.min(
                                        creditRequests.current_page *
                                            creditRequests.per_page,
                                        creditRequests.total,
                                    )}
                                </span>{' '}
                                sur{' '}
                                <span className="font-medium text-foreground">
                                    {creditRequests.total}
                                </span>{' '}
                                résultats
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 rounded-lg font-medium"
                                    disabled={creditRequests.current_page === 1}
                                    onClick={() =>
                                        router.get(
                                            creditRequests.links.find(
                                                (l: any) =>
                                                    l.label === '« Previous',
                                            )?.url,
                                        )
                                    }
                                >
                                    Précédent
                                </Button>

                                <div className="flex items-center gap-1">
                                    {creditRequests.links
                                        .filter(
                                            (l: any) =>
                                                !l.label.includes('Previous') &&
                                                !l.label.includes('Next'),
                                        )
                                        .map((link: any, i: number) => (
                                            <Button
                                                key={i}
                                                variant={
                                                    link.active
                                                        ? 'default'
                                                        : 'ghost'
                                                }
                                                size="sm"
                                                className={cn(
                                                    'h-9 w-9 rounded-lg font-medium',
                                                    !link.active &&
                                                        'hover:bg-muted',
                                                )}
                                                onClick={() =>
                                                    link.url && router.get(link.url)
                                                }
                                                disabled={!link.url}
                                            >
                                                {link.label}
                                            </Button>
                                        ))}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 rounded-lg font-medium"
                                    disabled={
                                        creditRequests.current_page ===
                                        creditRequests.last_page
                                    }
                                    onClick={() =>
                                        router.get(
                                            creditRequests.links.find(
                                                (l: any) => l.label === 'Next »',
                                            )?.url,
                                        )
                                    }
                                >
                                    Suivant
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <AlertDialog open={!!requestToDelete} onOpenChange={(open) => !open && setRequestToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Cette action va supprimer le dossier de prêt{' '}
                                <span className="font-semibold text-foreground">
                                    {requestToDelete?.code}
                                </span>{' '}
                                ({requestToDelete?.student?.first_name}{' '}
                                {requestToDelete?.student?.last_name}). Le dossier sera placé dans la corbeille.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={confirmDelete}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                Supprimer
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CreditLayout>
        </Suspense>
    );
}

function cn(...inputs: (string | undefined | null | false)[]): string {
    return inputs.filter(Boolean).join(' ');
}

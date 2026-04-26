import { Head, router, useForm } from '@inertiajs/react';
import { AlertCircle, Edit, MoreHorizontal, Plus, Trash, Calendar, Percent } from 'lucide-react';
import * as React from 'react';

import { DataTable } from '@/components/admin/data-table';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/admin/admin-layout';
import { index as adminCreditTypesIndex, store, update, destroy } from '@/routes/admin/credit-types';

interface CreditType {
    id: number;
    name: string;
    description: string | null;
    rate: string | number;
    duration_months: number;
}

interface Props {
    creditTypes: {
        data: CreditType[];
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
        links: any[];
    };
    filters: { search?: string };
}

export default function CreditTypeIndex({ creditTypes, filters }: Props) {
    const [isSheetOpen, setIsSheetOpen] = React.useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
    const [editingCreditType, setEditingCreditType] = React.useState<CreditType | null>(null);
    const [creditTypeToDelete, setCreditTypeToDelete] = React.useState<CreditType | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        description: '',
        rate: '',
        duration_months: '',
    });

    const openCreateSheet = () => {
        setEditingCreditType(null);
        reset();
        clearErrors();
        setIsSheetOpen(true);
    };

    const openEditSheet = (creditType: CreditType) => {
        setEditingCreditType(creditType);
        setData({
            name: creditType.name,
            description: creditType.description || '',
            rate: creditType.rate.toString(),
            duration_months: creditType.duration_months.toString(),
        });
        clearErrors();
        setIsSheetOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingCreditType) {
            put(update(editingCreditType.id).url, {
                onSuccess: () => setIsSheetOpen(false),
            });
        } else {
            post(store().url, {
                onSuccess: () => setIsSheetOpen(false),
            });
        }
    };

    const confirmDelete = (creditType: CreditType) => {
        setCreditTypeToDelete(creditType);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = () => {
        if (creditTypeToDelete) {
            router.delete(destroy(creditTypeToDelete.id).url, {
                onSuccess: () => setIsDeleteDialogOpen(false),
            });
        }
    };

    const handleSearch = (search: string) => {
        router.get(adminCreditTypesIndex().url,
            { ...filters, search, page: 1 },
            { preserveState: true, replace: true }
        );
    };

    const columns = [
        { header: 'Nom', accessorKey: 'name' },
        {
            header: 'Taux (%)',
            accessorKey: 'rate',
            cell: (ct: CreditType) => (
                <div className="flex items-center gap-1 font-medium">
                    <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                    {ct.rate}%
                </div>
            )
        },
        {
            header: 'Durée (mois)',
            accessorKey: 'duration_months',
            cell: (ct: CreditType) => (
                <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    {ct.duration_months} mois
                </div>
            )
        },
        {
            header: 'Actions',
            accessorKey: 'actions',
            cell: (ct: CreditType) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[160px]">
                        <DropdownMenuItem onClick={() => openEditSheet(ct)}>
                            <Edit className="mr-2 h-4 w-4" /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => confirmDelete(ct)}>
                            <Trash className="mr-2 h-4 w-4" /> Supprimer
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    ];

    const breadcrumbs = [
        { title: 'Administration', href: '#' },
        { title: 'Type de prêt', href: adminCreditTypesIndex().url },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Gestion des Types de Prêt" />

            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Types de Prêt</h2>
                        <p className="text-muted-foreground">Configurez les différents types de crédits scolaires disponibles.</p>
                    </div>
                    <Button onClick={openCreateSheet} className="shadow-sm shadow-primary/20">
                        <Plus className="mr-2 h-4 w-4" /> Ajouter un type de prêt
                    </Button>
                </div>

                <DataTable
                    data={creditTypes.data}
                    columns={columns}
                    meta={creditTypes}
                    onSearch={handleSearch}
                />

                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetContent className="p-0 flex flex-col gap-0 border-l shadow-2xl">
                        <form onSubmit={handleSubmit} className="flex flex-col h-full">
                            <SheetHeader className="p-6 border-b bg-muted/5">
                                <SheetTitle className="text-xl font-extrabold tracking-tight">
                                    {editingCreditType ? 'Modifier le type de prêt' : 'Ajouter un type de prêt'}
                                </SheetTitle>
                                <SheetDescription className="text-sm text-muted-foreground">
                                    Définissez les conditions pour ce type de crédit.
                                </SheetDescription>
                            </SheetHeader>
                            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                <div className="grid gap-6">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name" className="text-sm font-semibold">Nom du type de prêt</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                            placeholder="ex: Crédit Scolaire Primaire"
                                            className="h-10 transition-all focus:ring-2 focus:ring-primary/20"
                                        />
                                        {errors.name && <p className="text-sm font-medium text-destructive">{errors.name}</p>}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="grid gap-2">
                                            <Label htmlFor="rate" className="text-sm font-semibold">Taux d'intérêt (%)</Label>
                                            <div className="relative">
                                                <Percent className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="rate"
                                                    type="number"
                                                    step="0.01"
                                                    value={data.rate}
                                                    onChange={e => setData('rate', e.target.value)}
                                                    placeholder="5.5"
                                                    className="h-10 pl-9 transition-all focus:ring-2 focus:ring-primary/20"
                                                />
                                            </div>
                                            {errors.rate && <p className="text-sm font-medium text-destructive">{errors.rate}</p>}
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="duration_months" className="text-sm font-semibold">Durée maximale (mois)</Label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="duration_months"
                                                    type="number"
                                                    value={data.duration_months}
                                                    onChange={e => setData('duration_months', e.target.value)}
                                                    placeholder="10"
                                                    className="h-10 pl-9 transition-all focus:ring-2 focus:ring-primary/20"
                                                />
                                            </div>
                                            {errors.duration_months && <p className="text-sm font-medium text-destructive">{errors.duration_months}</p>}
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="description" className="text-sm font-semibold">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={data.description}
                                            onChange={e => setData('description', e.target.value)}
                                            placeholder="Décrivez les conditions spécifiques..."
                                            className="min-h-[120px] transition-all focus:ring-2 focus:ring-primary/20"
                                        />
                                        {errors.description && <p className="text-sm font-medium text-destructive">{errors.description}</p>}
                                    </div>
                                </div>
                            </div>
                            <SheetFooter className="p-6 border-t bg-muted/20">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsSheetOpen(false)}
                                    disabled={processing}
                                    className="px-8 h-10"
                                >
                                    Annuler
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="px-8 h-10 shadow-sm shadow-primary/20"
                                >
                                    {processing ? 'Chargement...' : (editingCreditType ? 'Enregistrer les modifications' : 'Créer le type de prêt')}
                                </Button>
                            </SheetFooter>
                        </form>
                    </SheetContent>
                </Sheet>

                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                                <AlertCircle className="h-5 w-5" />
                                Confirmer la suppression
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer le type de prêt <strong>{creditTypeToDelete?.name}</strong> ? Cette action peut être annulée ultérieurement (soft delete).
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Supprimer
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AdminLayout>
    );
}

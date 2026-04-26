import { Head, router, useForm } from '@inertiajs/react';
import { Edit, MoreHorizontal, Plus, Trash, Flag } from 'lucide-react';
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
import AdminLayout from '@/layouts/admin/admin-layout';
import { store, update, destroy } from '@/routes/admin/countries';

interface Country {
    id: number;
    name: string;
    code: string;
}

interface Props {
    countries: {
        data: Country[];
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
        links: any[];
    };
    filters: { search?: string };
}

export default function CountryIndex({ countries, filters }: Props) {
    const [isSheetOpen, setIsSheetOpen] = React.useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
    const [editingCountry, setEditingCountry] = React.useState<Country | null>(null);
    const [countryToDelete, setCountryToDelete] = React.useState<Country | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        code: '',
    });

    const openCreateSheet = () => {
        setEditingCountry(null);
        reset();
        clearErrors();
        setIsSheetOpen(true);
    };

    const openEditSheet = (country: Country) => {
        setEditingCountry(country);
        setData({
            name: country.name,
            code: country.code,
        });
        clearErrors();
        setIsSheetOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingCountry) {
            put(update(editingCountry.id).url, {
                onSuccess: () => setIsSheetOpen(false),
            });
        } else {
            post(store().url, {
                onSuccess: () => setIsSheetOpen(false),
            });
        }
    };

    const confirmDelete = (country: Country) => {
        setCountryToDelete(country);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = () => {
        if (countryToDelete) {
            router.delete(destroy(countryToDelete.id).url, {
                onSuccess: () => setIsDeleteDialogOpen(false),
            });
        }
    };

    const columns = [
        {
            key: 'name',
            header: 'Nom',
            cell: (country: Country) => (
                <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{country.name}</span>
                </div>
            ),
        },
        {
            key: 'code',
            header: 'Code',
            cell: (country: Country) => (
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">{country.code}</code>
            ),
        },
        {
            key: 'actions',
            header: '',
            cell: (country: Country) => (
                <div className="flex justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditSheet(country)}>
                                <Edit className="mr-2 h-4 w-4" /> Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => confirmDelete(country)}
                            >
                                <Trash className="mr-2 h-4 w-4" /> Supprimer
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        },
    ];

    return (
        <AdminLayout>
            <Head title="Gestion des pays" />

            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Pays</h1>
                        <p className="text-muted-foreground">Gérez la liste des pays disponibles dans l'application.</p>
                    </div>
                    <Button onClick={openCreateSheet}>
                        <Plus className="mr-2 h-4 w-4" /> Ajouter un pays
                    </Button>
                </div>

                <DataTable
                    columns={columns}
                    data={countries.data}
                    pagination={countries}
                    filters={filters}
                    searchPlaceholder="Rechercher un pays..."
                />
            </div>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>{editingCountry ? 'Modifier le pays' : 'Ajouter un pays'}</SheetTitle>
                        <SheetDescription>
                            {editingCountry
                                ? "Modifiez les informations du pays ci-dessous."
                                : "Remplissez les informations pour ajouter un nouveau pays."}
                        </SheetDescription>
                    </SheetHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nom</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="ex: Cameroun"
                            />
                            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="code">Code</Label>
                            <Input
                                id="code"
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value)}
                                placeholder="ex: CM"
                            />
                            {errors.code && <p className="text-sm text-destructive">{errors.code}</p>}
                        </div>

                        <SheetFooter className="pt-4">
                            <Button type="submit" disabled={processing}>
                                {editingCountry ? 'Mettre à jour' : 'Créer'}
                            </Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible. Cela supprimera définitivement le pays
                            <span className="font-semibold"> {countryToDelete?.name}</span> de la base de données.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AdminLayout>
    );
}

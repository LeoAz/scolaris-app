import { Head, router, useForm } from '@inertiajs/react';
import { AlertCircle, Edit, MoreHorizontal, Plus, Trash, Globe, FileText, Copy, Download } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import AdminLayout from '@/layouts/admin/admin-layout';
import { exportMethod as exportUsers } from '@/routes/admin/users';
import { index as adminUsersIndex, store, update, destroy } from '@/routes/admin/users';

interface User {
    id: number;
    name: string;
    email: string;
    username: string;
    roles: { id: number; name: string }[];
    countries: { id: number; code: string; name: string }[];
    credit_types: { id: number; name: string }[];
}

interface Props {
    users: {
        data: User[];
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
        links: any[];
    };
    roles: { id: number; name: string; description: string | null }[];
    countries: { id: number; code: string; name: string }[];
    creditTypes: { id: number; name: string }[];
    filters: { search?: string; country?: string };
}

export default function UserIndex({ users, roles, countries, creditTypes, filters }: Props) {
    const [isSheetOpen, setIsSheetOpen] = React.useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
    const [editingUser, setEditingUser] = React.useState<User | null>(null);
    const [userToDelete, setUserToDelete] = React.useState<User | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        email: '',
        username: '',
        password: '',
        roles: [] as string[],
        countries: [] as number[],
        credit_types: [] as number[],
    });

    const openCreateSheet = () => {
        setEditingUser(null);
        reset();
        clearErrors();
        setIsSheetOpen(true);
    };

    const openEditSheet = (user: User) => {
        setEditingUser(user);
        setData({
            name: user.name,
            email: user.email,
            username: user.username,
            password: '',
            roles: user.roles.map(r => r.id.toString()),
            countries: user.countries.map(c => c.id),
            credit_types: user.credit_types.map(ct => ct.id),
        });
        clearErrors();
        setIsSheetOpen(true);
    };

    const duplicateUser = (user: User) => {
        setEditingUser(null);
        setData({
            name: `${user.name} (Copie)`,
            email: `copy-${user.email}`,
            username: `${user.username}_copy`,
            password: '',
            roles: user.roles.map(r => r.id.toString()),
            countries: user.countries.map(c => c.id),
            credit_types: user.credit_types.map(ct => ct.id),
        });
        clearErrors();
        setIsSheetOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingUser) {
            put(update(editingUser.id).url, {
                onSuccess: () => setIsSheetOpen(false),
            });
        } else {
            post(store().url, {
                onSuccess: () => setIsSheetOpen(false),
            });
        }
    };

    const confirmDelete = (user: User) => {
        setUserToDelete(user);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = () => {
        if (userToDelete) {
            router.delete(destroy(userToDelete.id).url, {
                onSuccess: () => setIsDeleteDialogOpen(false),
            });
        }
    };

    const handleSearch = (search: string) => {
        router.get(adminUsersIndex().url,
            { ...filters, search, page: 1 },
            { preserveState: true, replace: true }
        );
    };

    const handleCountryFilter = (countryId: string) => {
        const country = countryId === 'all' ? undefined : countryId;
        router.get(adminUsersIndex().url,
            { ...filters, country, page: 1 },
            { preserveState: true, replace: true }
        );
    };

    const columns = [
        { header: 'Nom', accessorKey: 'name' },
        { header: 'Email', accessorKey: 'email' },
        { header: 'Pseudo', accessorKey: 'username' },
        {
            header: 'Rôles',
            accessorKey: 'roles',
            cell: (user: User) => (
                <div className="flex flex-wrap gap-1">
                    {user.roles.map(role => (
                        <Badge key={role.id} variant="secondary">{role.name}</Badge>
                    ))}
                </div>
            )
        },
        {
            header: 'Pays',
            accessorKey: 'countries',
            cell: (user: User) => (
                <div className="flex flex-wrap gap-1">
                    {user.countries.map(country => (
                        <Badge key={country.id} variant="outline" className="flex items-center gap-1">
                            <Globe className="h-3 w-3 opacity-50" />
                            {country.code}
                        </Badge>
                    ))}
                </div>
            )
        },
        {
            header: 'Actions',
            accessorKey: 'actions',
            cell: (user: User) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[160px]">
                        <DropdownMenuItem onClick={() => openEditSheet(user)}>
                            <Edit className="mr-2 h-4 w-4" /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => duplicateUser(user)}>
                            <Copy className="mr-2 h-4 w-4" /> Dupliquer
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => confirmDelete(user)}>
                            <Trash className="mr-2 h-4 w-4" /> Supprimer
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    ];

    const breadcrumbs = [
        { title: 'Administration', href: adminUsersIndex().url },
        { title: 'Utilisateurs', href: adminUsersIndex().url },
    ];

    const userFilters = (
        <Select value={filters.country || 'all'} onValueChange={handleCountryFilter}>
            <SelectTrigger className="w-[180px] h-8 rounded-lg bg-background">
                <SelectValue placeholder="Filtrer par pays" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Tous les pays</SelectItem>
                {countries.map(country => (
                    <SelectItem key={country.id} value={country.id.toString()}>
                        {country.name} ({country.code})
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );

    const handleExport = () => {
        window.open(exportUsers().url, '_blank');
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Gestion des Utilisateurs" />

            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Utilisateurs</h2>
                        <p className="text-muted-foreground">Gérez les utilisateurs de votre application et leurs permissions.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleExport} className="shadow-sm">
                            <Download className="mr-2 h-4 w-4" /> Exporter Excel
                        </Button>
                        <Button onClick={openCreateSheet} className="shadow-sm shadow-primary/20">
                            <Plus className="mr-2 h-4 w-4" /> Ajouter un utilisateur
                        </Button>
                    </div>
                </div>

                <DataTable
                    data={users.data}
                    columns={columns}
                    meta={users}
                    onSearch={handleSearch}
                    filters={userFilters}
                />

                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetContent className="p-0 flex flex-col gap-0 border-l shadow-2xl sm:max-w-[1200px]">
                        <form onSubmit={handleSubmit} className="flex flex-col h-full">
                            <SheetHeader className="p-6 border-b bg-muted/5">
                                <SheetTitle className="text-xl font-extrabold tracking-tight">
                                    {editingUser ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}
                                </SheetTitle>
                                <SheetDescription className="text-sm text-muted-foreground">
                                    Complétez les informations pour {editingUser ? 'mettre à jour' : 'créer'} le profil utilisateur.
                                </SheetDescription>
                            </SheetHeader>
                            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                <div className="grid gap-6">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name" className="text-sm font-semibold">Nom complet</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                            placeholder="Jean Dupont"
                                            className="h-10 transition-all focus:ring-2 focus:ring-primary/20"
                                        />
                                        {errors.name && <p className="text-sm font-medium text-destructive">{errors.name}</p>}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="grid gap-2">
                                            <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={data.email}
                                                onChange={e => setData('email', e.target.value)}
                                                placeholder="jean.dupont@example.com"
                                                className="h-10 transition-all focus:ring-2 focus:ring-primary/20"
                                            />
                                            {errors.email && <p className="text-sm font-medium text-destructive">{errors.email}</p>}
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="username" className="text-sm font-semibold">Pseudo</Label>
                                            <Input
                                                id="username"
                                                value={data.username}
                                                onChange={e => setData('username', e.target.value)}
                                                placeholder="jdupont"
                                                className="h-10 transition-all focus:ring-2 focus:ring-primary/20"
                                            />
                                            {errors.username && <p className="text-sm font-medium text-destructive">{errors.username}</p>}
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="password" title={editingUser ? 'laisser vide pour ne pas changer' : ''} className="text-sm font-semibold flex items-center justify-between">
                                            <span>Mot de passe</span>
                                            {editingUser && <span className="text-xs font-normal text-muted-foreground">(Optionnel)</span>}
                                        </Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={data.password}
                                            onChange={e => setData('password', e.target.value)}
                                            className="h-10 transition-all focus:ring-2 focus:ring-primary/20"
                                        />
                                        {errors.password && <p className="text-sm font-medium text-destructive">{errors.password}</p>}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between pb-2 border-b">
                                        <Label className="text-base font-bold">Rôles assignés</Label>
                                        <span className="text-xs text-muted-foreground">{data.roles.length} sélectionné(s)</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {roles.map(role => {
                                            const isChecked = data.roles.includes(role.id.toString()) || data.roles.includes(role.name);

                                            return (
                                                <div
                                                    key={role.id}
                                                    className={`
                                                        relative flex items-start space-x-3 space-y-0 rounded-lg border p-4 transition-all hover:bg-muted/50
                                                        ${isChecked ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-input'}
                                                    `}
                                                >
                                                    <div className="flex h-5 items-center">
                                                        <Checkbox
                                                            id={`role-${role.id}`}
                                                            checked={isChecked}
                                                            onCheckedChange={(checked) => {
                                                                const newRoles = checked
                                                                    ? [...data.roles, role.id.toString()]
                                                                    : data.roles.filter(r => r !== role.id.toString() && r !== role.name);
                                                                setData('roles', newRoles);
                                                            }}
                                                            className="data-[state=checked]:bg-primary"
                                                        />
                                                    </div>
                                                    <div className="grid gap-1.5 leading-none">
                                                        <label
                                                            htmlFor={`role-${role.id}`}
                                                            className="text-sm font-medium leading-none cursor-pointer select-none"
                                                        >
                                                            {role.name}
                                                        </label>
                                                        {role.description && (
                                                            <p className="text-[11px] text-muted-foreground line-clamp-2">{role.description}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {errors.roles && <p className="text-sm font-medium text-destructive">{errors.roles}</p>}
                                </div>

                                <div className="space-y-4 pb-4">
                                    <div className="flex items-center justify-between pb-2 border-b">
                                        <div className="flex flex-col">
                                            <Label className="text-base font-bold">Accès pays</Label>
                                            <span className="text-[11px] text-muted-foreground italic">
                                                {data.roles.some(r => {
                                                    const role = roles.find(role => role.id.toString() === r || role.name === r);

                                                    return role && ['Super admin', 'Administrateur'].includes(role.name);
                                                })
                                                    ? 'Facultatif pour les administrateurs'
                                                    : 'Requis pour les autres rôles'}
                                            </span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">{data.countries.length} sélectionné(s)</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {countries.map(country => {
                                            const isChecked = data.countries.includes(country.id);

                                            return (
                                                <div
                                                    key={country.id}
                                                    className={`
                                                        relative flex items-start space-x-3 space-y-0 rounded-lg border p-4 transition-all hover:bg-muted/50
                                                        ${isChecked ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-input'}
                                                    `}
                                                >
                                                    <div className="flex h-5 items-center">
                                                        <Checkbox
                                                            id={`country-${country.id}`}
                                                            checked={isChecked}
                                                            onCheckedChange={(checked) => {
                                                                const newCountries = checked
                                                                    ? [...data.countries, country.id]
                                                                    : data.countries.filter(id => id !== country.id);
                                                                setData('countries', newCountries);
                                                            }}
                                                            className="data-[state=checked]:bg-primary"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2 leading-none">
                                                        <Globe className={`h-4 w-4 ${isChecked ? 'text-primary' : 'text-muted-foreground opacity-50'}`} />
                                                        <label
                                                            htmlFor={`country-${country.id}`}
                                                            className="text-sm font-medium leading-none cursor-pointer select-none"
                                                        >
                                                            {country.name} <span className="text-xs font-normal text-muted-foreground">({country.code})</span>
                                                        </label>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {errors.countries && <p className="text-sm font-medium text-destructive">{errors.countries}</p>}
                                </div>

                                <div className="space-y-4 pb-4">
                                    <div className="flex items-center justify-between pb-2 border-b">
                                        <div className="flex flex-col">
                                            <Label className="text-base font-bold">Dossiers autorisés (Types de crédit)</Label>
                                            <span className="text-[11px] text-muted-foreground italic">
                                                L'utilisateur pourra voir seulement ces types de dossiers
                                            </span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">{data.credit_types.length} sélectionné(s)</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {creditTypes.map(type => {
                                            const isChecked = data.credit_types.includes(type.id);

                                            return (
                                                <div
                                                    key={type.id}
                                                    className={`
                                                        relative flex items-start space-x-3 space-y-0 rounded-lg border p-4 transition-all hover:bg-muted/50
                                                        ${isChecked ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-input'}
                                                    `}
                                                >
                                                    <div className="flex h-5 items-center">
                                                        <Checkbox
                                                            id={`credit-type-${type.id}`}
                                                            checked={isChecked}
                                                            onCheckedChange={(checked) => {
                                                                const newTypes = checked
                                                                    ? [...data.credit_types, type.id]
                                                                    : data.credit_types.filter(id => id !== type.id);
                                                                setData('credit_types', newTypes);
                                                            }}
                                                            className="data-[state=checked]:bg-primary"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2 leading-none">
                                                        <FileText className={`h-4 w-4 ${isChecked ? 'text-primary' : 'text-muted-foreground opacity-50'}`} />
                                                        <label
                                                            htmlFor={`credit-type-${type.id}`}
                                                            className="text-sm font-medium leading-none cursor-pointer select-none"
                                                        >
                                                            {type.name}
                                                        </label>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {errors.credit_types && <p className="text-sm font-medium text-destructive">{errors.credit_types}</p>}
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
                                    {processing ? 'Chargement...' : (editingUser ? 'Enregistrer les modifications' : 'Créer l\'utilisateur')}
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
                                Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{userToDelete?.name}</strong> ? Cette action peut être annulée ultérieurement (soft delete).
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

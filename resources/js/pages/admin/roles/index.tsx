import { Head, router, useForm } from '@inertiajs/react';
import { AlertCircle, Edit, MoreHorizontal, Plus, Trash, ShieldCheck } from 'lucide-react';
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
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import AdminLayout from '@/layouts/admin/admin-layout';
import { index as adminRolesIndex, store, update, destroy } from '@/routes/admin/roles';
import { index as adminUsersIndex } from '@/routes/admin/users';

interface Permission {
    id: number;
    name: string;
    group: string | null;
    description: string | null;
}

interface Role {
    id: number;
    name: string;
    description: string | null;
    permissions: Permission[];
}

interface Props {
    roles: {
        data: Role[];
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
        links: any[];
    };
    permissions: Permission[];
    filters: { search?: string };
}

export default function RoleIndex({ roles, permissions, filters }: Props) {
    const [isSheetOpen, setIsSheetOpen] = React.useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
    const [editingRole, setEditingRole] = React.useState<Role | null>(null);
    const [roleToDelete, setRoleToDelete] = React.useState<Role | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        description: '',
        permissions: [] as string[],
    });

    const openCreateSheet = () => {
        setEditingRole(null);
        reset();
        clearErrors();
        setIsSheetOpen(true);
    };

    const openEditSheet = (role: Role) => {
        setEditingRole(role);
        setData({
            name: role.name,
            description: role.description || '',
            permissions: role.permissions.map(p => p.name),
        });
        clearErrors();
        setIsSheetOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingRole) {
            put(update(editingRole.id).url, {
                onSuccess: () => setIsSheetOpen(false),
            });
        } else {
            post(store().url, {
                onSuccess: () => setIsSheetOpen(false),
            });
        }
    };

    const confirmDelete = (role: Role) => {
        if (role.name === 'Super admin') {
            return;
        }

        setRoleToDelete(role);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = () => {
        if (roleToDelete) {
            router.delete(destroy(roleToDelete.id).url, {
                onSuccess: () => setIsDeleteDialogOpen(false),
            });
        }
    };

    const handleSearch = (search: string) => {
        router.get(adminRolesIndex().url,
            { ...filters, search, page: 1 },
            { preserveState: true, replace: true }
        );
    };

    const columns = [
        { header: 'ID', accessorKey: 'id' },
        {
            header: 'Nom',
            accessorKey: 'name',
            cell: (role: Role) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-foreground">{role.name}</span>
                    {role.description && <span className="text-xs text-muted-foreground line-clamp-1">{role.description}</span>}
                </div>
            ),
        },
        {
            header: 'Permissions',
            accessorKey: 'permissions',
            cell: (role: Role) => (
                <div className="flex flex-wrap gap-1">
                    {role.permissions.map(permission => (
                        <Badge key={permission.id} variant="secondary">{permission.name}</Badge>
                    ))}
                </div>
            )
        },
        {
            header: 'Actions',
            accessorKey: 'actions',
            cell: (role: Role) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[160px]">
                        <DropdownMenuItem onClick={() => openEditSheet(role)}>
                            <Edit className="mr-2 h-4 w-4" /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => confirmDelete(role)}
                            disabled={role.name === 'Super admin'}
                        >
                            <Trash className="mr-2 h-4 w-4" /> Supprimer
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    ];

    const breadcrumbs = [
        { title: 'Administration', href: adminUsersIndex().url },
        { title: 'Rôles', href: adminRolesIndex().url },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Gestion des Rôles" />

            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Rôles</h2>
                        <p className="text-muted-foreground">Gérez les rôles et leurs permissions associées.</p>
                    </div>
                    <Button onClick={openCreateSheet} className="shadow-sm shadow-primary/20">
                        <Plus className="mr-2 h-4 w-4" /> Ajouter un rôle
                    </Button>
                </div>

                <DataTable
                    data={roles.data}
                    columns={columns}
                    meta={roles}
                    onSearch={handleSearch}
                />

                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetContent className="p-0 flex flex-col gap-0 border-l shadow-2xl">
                        <form onSubmit={handleSubmit} className="flex flex-col h-full">
                            <SheetHeader className="p-6 border-b bg-muted/5">
                                <SheetTitle className="text-xl font-extrabold tracking-tight">
                                    {editingRole ? 'Modifier le rôle' : 'Ajouter un rôle'}
                                </SheetTitle>
                                <SheetDescription className="text-sm text-muted-foreground">
                                    Définissez le nom du rôle, sa description et les permissions accordées.
                                </SheetDescription>
                            </SheetHeader>
                            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name" className="text-sm font-semibold">Nom du rôle</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                            placeholder="Ex: Editeur, Responsable..."
                                            className="h-10 transition-all focus:ring-2 focus:ring-primary/20"
                                            disabled={editingRole?.name === 'Super admin'}
                                        />
                                        {errors.name && <p className="text-sm font-medium text-destructive">{errors.name}</p>}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="description" className="text-sm font-semibold">Description</Label>
                                        <Input
                                            id="description"
                                            value={data.description}
                                            onChange={e => setData('description', e.target.value)}
                                            placeholder="Bref descriptif des responsabilités..."
                                            className="h-10 transition-all focus:ring-2 focus:ring-primary/20"
                                        />
                                        {errors.description && <p className="text-sm font-medium text-destructive">{errors.description}</p>}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between pb-2 border-b">
                                        <Label className="text-base font-bold">Permissions</Label>
                                        <div className="flex items-center gap-4">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-xs h-7"
                                                onClick={() => setData('permissions', permissions.map(p => p.name))}
                                            >
                                                Tout sélectionner
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-xs h-7"
                                                onClick={() => setData('permissions', [])}
                                            >
                                                Tout désélectionner
                                            </Button>
                                            <span className="text-xs text-muted-foreground">{data.permissions.length} sélectionnée(s)</span>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        {Object.entries(
                                            permissions.reduce((acc, permission) => {
                                                const group = permission.group || 'Autres';

                                                if (!acc[group]) {
                                                    acc[group] = [];
                                                }

                                                acc[group].push(permission);

                                                return acc;
                                            }, {} as Record<string, Permission[]>)
                                        ).map(([group, groupPermissions]) => (
                                            <div key={group} className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">
                                                        {group}
                                                    </h4>
                                                    <Button
                                                        type="button"
                                                        variant="link"
                                                        size="sm"
                                                        className="text-[10px] h-auto p-0 text-muted-foreground hover:text-primary"
                                                        onClick={() => {
                                                            const groupNames = groupPermissions.map(p => p.name);
                                                            const allInGroupSelected = groupNames.every(name => data.permissions.includes(name));

                                                            if (allInGroupSelected) {
                                                                setData('permissions', data.permissions.filter(name => !groupNames.includes(name)));
                                                            } else {
                                                                setData('permissions', Array.from(new Set([...data.permissions, ...groupNames])));
                                                            }
                                                        }}
                                                    >
                                                        {groupPermissions.every(p => data.permissions.includes(p.name)) ? '(Désélectionner tout le groupe)' : '(Sélectionner tout le groupe)'}
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {groupPermissions.map(permission => {
                                                        const isChecked = data.permissions.includes(permission.name);

                                                        return (
                                                            <div
                                                                key={permission.id}
                                                                className={`
                                                                    relative flex items-start space-x-3 space-y-0 rounded-lg border p-4 transition-all hover:bg-muted/50
                                                                    ${isChecked ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-input'}
                                                                `}
                                                            >
                                                                <div className="flex h-5 items-center">
                                                                    <Checkbox
                                                                        id={`permission-${permission.id}`}
                                                                        checked={isChecked}
                                                                        onCheckedChange={(checked) => {
                                                                            const newPermissions = checked
                                                                                ? [...data.permissions, permission.name]
                                                                                : data.permissions.filter(p => p !== permission.name);
                                                                            setData('permissions', newPermissions);
                                                                        }}
                                                                        className="data-[state=checked]:bg-primary"
                                                                    />
                                                                </div>
                                                                <div className="flex items-center gap-2 leading-none">
                                                                    <ShieldCheck className={`h-4 w-4 ${isChecked ? 'text-primary' : 'text-muted-foreground opacity-50'}`} />
                                                                    <div className="flex flex-col gap-0.5">
                                                                        <label
                                                                            htmlFor={`permission-${permission.id}`}
                                                                            className="text-sm font-medium leading-none cursor-pointer select-none"
                                                                        >
                                                                            {permission.name}
                                                                        </label>
                                                                        {permission.description && (
                                                                            <span className="text-[10px] text-muted-foreground line-clamp-1">
                                                                                {permission.description}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {errors.permissions && <p className="text-sm font-medium text-destructive">{errors.permissions}</p>}
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
                                    {processing ? 'Chargement...' : (editingRole ? 'Enregistrer les modifications' : 'Créer le rôle')}
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
                                Êtes-vous sûr de vouloir supprimer le rôle <strong>{roleToDelete?.name}</strong> ? Cette action est irréversible et pourrait affecter les utilisateurs associés.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={processing}>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleDelete();
                                }}
                                disabled={processing}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                {processing ? 'Suppression...' : 'Supprimer définitivement'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AdminLayout>
    );
}

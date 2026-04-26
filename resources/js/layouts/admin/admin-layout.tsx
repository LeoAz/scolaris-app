import { Link, usePage } from '@inertiajs/react';
import { Activity, Banknote, ChevronRight, Flag, Key, Shield, User } from 'lucide-react';

import { useFlashToast } from '@/hooks/use-flash-toast';
import { cn } from '@/lib/utils';
import { index as adminActivitiesIndex } from '@/routes/admin/activities';
import { index as adminCountriesIndex } from '@/routes/admin/countries';
import { index as adminCreditTypesIndex } from '@/routes/admin/credit-types';
import { index as adminPermissionsIndex } from '@/routes/admin/permissions';
import { index as adminRolesIndex } from '@/routes/admin/roles';
import { index as adminUsersIndex } from '@/routes/admin/users';
import type { AppLayoutProps } from '@/types';
import AppLayout from '../app-layout';

export default function AdminLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    useFlashToast();
    const { url } = usePage();

    const menuItems = [
        { label: 'Utilisateurs', href: adminUsersIndex().url, icon: User },
        { label: 'Rôles', href: adminRolesIndex().url, icon: Shield },
        { label: 'Permissions', href: adminPermissionsIndex().url, icon: Key },
        { label: 'Pays', href: adminCountriesIndex().url, icon: Flag },
        { label: 'Activités', href: adminActivitiesIndex().url, icon: Activity },
    ];

    const folderItems = [
        { label: 'Type de prêt', href: adminCreditTypesIndex().url, icon: Banknote },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex flex-col md:flex-row gap-8 h-full py-6">
                {/* Navigation Menu (Left) */}
                <aside className="w-full md:w-72 flex-none">
                    <div className="sticky top-4 space-y-4">
                        <div className="px-3 py-2">
                            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-foreground/70 uppercase text-[10px]">
                                Administration
                            </h2>
                            <div className="space-y-1">
                                {menuItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = url === item.href || (item.href !== '/' && url.startsWith(item.href));

                                    return (
                                        <Link
                                            key={item.href}
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
                                            {isActive && <ChevronRight className="h-4 w-4 opacity-70" />}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="px-3 py-2">
                            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-foreground/70 uppercase text-[10px]">
                                Gestion des dossiers
                            </h2>
                            <div className="space-y-1">
                                {folderItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = url === item.href || (item.href !== '/' && url.startsWith(item.href));

                                    return (
                                        <Link
                                            key={item.href}
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
                                            {isActive && <ChevronRight className="h-4 w-4 opacity-70" />}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mx-4 p-4 rounded-xl bg-muted/40 border border-border/50 hidden md:block">
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Utilisez ce menu pour gérer les accès, les rôles et surveiller les activités du système.
                            </p>
                        </div>
                    </div>
                </aside>

                {/* Main Content (Right) */}
                <main className="flex-1 min-w-0 space-y-6">
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {children}
                    </div>
                </main>
            </div>
        </AppLayout>
    );
}

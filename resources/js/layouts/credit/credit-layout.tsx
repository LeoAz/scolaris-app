import { Link, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    ChevronRight,
    ClipboardList,
    Clock,
    FileText,
    LayoutDashboard,
    XCircle
} from 'lucide-react';
import { useFlashToast } from '@/hooks/use-flash-toast';
import { cn } from '@/lib/utils';
import { index as creditIndex } from '@/routes/credit';
import terminationRequests from '@/routes/credit/termination-requests/index';
import type { AppLayoutProps } from '@/types';

interface CreditLayoutProps extends AppLayoutProps {
    statusCounts?: Record<string, number>;
    totalCount?: number;
    hideSidebar?: boolean;
}

export default function CreditLayout({
    children,
    statusCounts: propsStatusCounts,
    totalCount: propsTotalCount,
    hideSidebar = false,
}: CreditLayoutProps) {
    useFlashToast();
    const { url, props } = usePage();

    // Use shared data if props are not provided
    const sharedCredit = (props as any).credit || {};
    const statusCounts = propsStatusCounts || sharedCredit.statusCounts || {};
    const totalCount = propsTotalCount ?? sharedCredit.totalCount ?? 0;

    const statuses = [
        {
            label: 'Tous les dossiers',
            value: null,
            icon: LayoutDashboard,
            count: totalCount,
            color: 'text-foreground'
        },
        {
            label: 'Résiliations',
            value: 'termination',
            icon: XCircle,
            count: 0, // Optionnel : vous pourriez passer le compte des demandes en attente
            color: 'text-red-600',
            badgeBg: 'bg-red-600/10',
            badgeText: 'text-red-600',
            href: terminationRequests.index().url
        },
        {
            label: 'Création',
            value: 'creation',
            icon: FileText,
            count: statusCounts['creation'] || 0,
            color: 'text-blue-500',
            badgeBg: 'bg-blue-500/10',
            badgeText: 'text-blue-500'
        },
        {
            label: 'Soumis',
            value: 'soumis',
            icon: Clock,
            count: statusCounts['soumis'] || 0,
            color: 'text-orange-500',
            badgeBg: 'bg-orange-500/10',
            badgeText: 'text-orange-500'
        },
        {
            label: 'Validé',
            value: 'valider',
            icon: CheckCircle2,
            count: statusCounts['valider'] || 0,
            color: 'text-green-500',
            badgeBg: 'bg-green-500/10',
            badgeText: 'text-green-500'
        },
        {
            label: 'Rejeté',
            value: 'rejeter',
            icon: XCircle,
            count: statusCounts['rejeter'] || 0,
            color: 'text-red-500',
            badgeBg: 'bg-red-500/10',
            badgeText: 'text-red-500'
        },
        {
            label: 'Clôturé',
            value: 'cloturer',
            icon: ClipboardList,
            count: statusCounts['cloturer'] || 0,
            color: 'text-slate-500',
            badgeBg: 'bg-slate-500/10',
            badgeText: 'text-slate-500'
        },
        {
            label: 'Résilié',
            value: 'resilie',
            icon: AlertCircle,
            count: statusCounts['resilie'] || 0,
            color: 'text-purple-500',
            badgeBg: 'bg-purple-500/10',
            badgeText: 'text-purple-500'
        },
    ];

    return (
        <div className={cn("flex flex-col md:flex-row gap-8 h-full py-6", hideSidebar && "md:flex-col")}>
                {!hideSidebar && <aside className="w-full md:w-72 flex-none">
                    <div className="sticky top-4 space-y-4">
                        <div className="px-3 py-2">
                            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-foreground/70 uppercase text-[10px]">
                                Statuts des dossiers
                            </h2>
                            <div className="space-y-1">
                                {statuses.map((status) => {
                                    const Icon = status.icon;
                                    const searchParams = new URLSearchParams(url.split('?')[1] || '');
                                    const currentStatus = searchParams.get('status');

                                    const isActive = status.value
                                        ? currentStatus === status.value
                                        : !currentStatus;

                                    // Create href while preserving other search params (except status which we want to change)
                                    const nextSearchParams = new URLSearchParams(searchParams);

                                    if (status.value) {
                                        nextSearchParams.set('status', status.value);
                                    } else {
                                        nextSearchParams.delete('status');
                                    }

                                    // Reset page when filtering by status
                                    nextSearchParams.delete('page');

                                    const href = (status as any).href || `${creditIndex().url}${nextSearchParams.toString() ? '?' + nextSearchParams.toString() : ''}`;

                                    return (
                                        <Link
                                            key={status.label}
                                            href={href}
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
                                                    isActive
                                                        ? "text-primary-foreground"
                                                        : cn("opacity-80", status.color)
                                                )} />
                                                {status.label}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-full text-[10px] font-bold min-w-[1.5rem] text-center",
                                                    isActive
                                                        ? "bg-primary-foreground/20 text-primary-foreground"
                                                        : cn(status.badgeBg, status.badgeText)
                                                )}>
                                                    {status.count}
                                                </span>
                                                {isActive && <ChevronRight className="h-4 w-4 opacity-70" />}
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mx-4 p-4 rounded-xl bg-muted/40 border border-border/50 hidden md:block">
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Filtrez les dossiers par statut pour gérer efficacement le flux de traitement des demandes de prêt.
                            </p>
                        </div>
                    </div>
                </aside>}

                {/* Main Content (Right) */}
                <main className="flex-1 min-w-0 space-y-6">
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {children}
                    </div>
                </main>
            </div>
    );
}

import { router } from '@inertiajs/react';
import {
    ChevronRight,
    CreditCard as CreditCardIcon,
    Edit,
    Eye,
    Folder,
    Globe,
    MoreHorizontal,
    Trash2,
    Undo2,
} from 'lucide-react';
import { memo } from 'react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { usePermission } from '@/hooks/use-permission';
import { index as installmentIndex } from '@/routes/credit/installments';
import { create as terminationCreate } from '@/routes/credit/termination-requests/index';
import type { CreditRequest } from '@/types';

interface CreditCardProps {
    request: CreditRequest;
    onView?: (request: CreditRequest) => void;
    onEdit?: (request: CreditRequest) => void;
    onDelete?: (request: CreditRequest) => void;
}

const statusConfig: Record<
    string,
    { label: string; dotClass: string; textClass: string }
> = {
    creation: {
        label: 'Création',
        dotClass: 'bg-blue-500',
        textClass: 'text-blue-600 dark:text-blue-400',
    },
    soumis: {
        label: 'Soumis',
        dotClass: 'bg-orange-500',
        textClass: 'text-orange-600 dark:text-orange-400',
    },
    valider: {
        label: 'Validé',
        dotClass: 'bg-green-500',
        textClass: 'text-green-600 dark:text-green-400',
    },
    rejeter: {
        label: 'Rejeté',
        dotClass: 'bg-red-500',
        textClass: 'text-red-600 dark:text-red-400',
    },
    cloturer: {
        label: 'Clôturé',
        dotClass: 'bg-gray-500',
        textClass: 'text-gray-600 dark:text-gray-400',
    },
    resilie: {
        label: 'Résilié',
        dotClass: 'bg-purple-500',
        textClass: 'text-purple-600 dark:text-purple-400',
    },
};

function formatCurrency(amount: string | number): string {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(Number(amount));
}

function formatDate(dateString?: string): string {
    if (!dateString) {
        return '—';
    }

    try {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return dateString;
    }
}


export const CreditCard = memo(function CreditCard({
    request,
    onView,
    onEdit,
    onDelete,
}: CreditCardProps) {
    const { hasPermission } = usePermission();
    const status = statusConfig[request.status] || statusConfig.creation;
    const amount = formatCurrency(request.amount_requested);
    const contribution = formatCurrency(request.initial_contribution);
    const totalRepaidValue = typeof request.total_repaid === 'string' ? parseFloat(request.total_repaid) : (request.total_repaid || 0);
    const totalRepaid = formatCurrency(totalRepaidValue);
    const lastRepayment = formatCurrency(request.last_repayment_amount || 0);
    const remainingToPay = formatCurrency(request.remaining_to_pay || 0);
    const hasFinancials = ['valider', 'cloturer', 'resilie'].includes(request.status);

    return (
        <div
            className="group relative flex flex-col overflow-hidden rounded-xl border border-border/60 bg-background transition-all hover:border-primary/30"
            onClick={() => onView?.(request)}
        >
            {/* Status vertical bar */}
            <div className={`absolute inset-y-0 left-0 w-1 ${status.dotClass} z-10`} />

            <div className="flex w-full flex-col p-4 md:flex-row md:items-center md:justify-between md:gap-4 md:px-6">
                <div className="flex items-center gap-4 md:flex-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-primary/5">
                        <Folder className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-foreground">
                            {request.student?.first_name} {request.student?.last_name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="font-mono font-medium text-primary">{request.code}</span>
                            <span className="text-border">•</span>
                            <span className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                {request.country?.name}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border/40 pt-4 md:mt-0 md:flex md:flex-1 md:items-center md:justify-center md:gap-8 md:border-0 md:pt-0">
                    {hasFinancials ? (
                        <>
                            <div className="space-y-0.5">
                                <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Déjà remboursé
                                </span>
                                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{totalRepaid}</p>
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Prochaine échéance
                                </span>
                                <p className="text-sm font-semibold text-muted-foreground">
                                    {request.next_installment ? formatDate(request.next_installment.due_date) : 'Aucune'}
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="space-y-0.5">
                                <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Montant sollicité
                                </span>
                                <p className="text-sm font-bold text-foreground">{amount}</p>
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                    Apport Initial
                                </span>
                                <p className="text-sm font-semibold text-muted-foreground">{contribution}</p>
                            </div>
                        </>
                    )}
                </div>

                <div className="mt-4 flex items-center justify-between gap-4 border-t border-border/40 pt-4 md:mt-0 md:flex-1 md:justify-end md:border-0 md:pt-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${status.dotClass} text-white`}
                        >
                            {status.label}
                        </span>
                        {request.is_complete === false && (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                INCOMPLET
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        {hasFinancials && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="hidden h-8 gap-2 rounded-lg text-xs font-medium md:flex"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    router.get(installmentIndex({ creditRequest: request.id }).url);
                                }}
                            >
                                <CreditCardIcon className="h-3.5 w-3.5" />
                                Échéancier
                            </Button>
                        )}

                        <div onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 rounded-full p-0 hover:bg-muted"
                                    >
                                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => onView?.(request)}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        Consulter
                                    </DropdownMenuItem>
                                    {hasFinancials && hasPermission('credit.installments.index') && (
                                        <DropdownMenuItem onClick={() => router.get(installmentIndex({ creditRequest: request.id }).url)}>
                                            <CreditCardIcon className="mr-2 h-4 w-4" />
                                            Échéancier
                                        </DropdownMenuItem>
                                    )}
                                    {hasPermission('credit.edit') && (
                                        <DropdownMenuItem onClick={() => onEdit?.(request)}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Modifier
                                        </DropdownMenuItem>
                                    )}
                                    {request.status === 'valider' && hasPermission('credit.termination-requests.create') && (
                                        <DropdownMenuItem onClick={() => router.get(terminationCreate({ creditRequest: request.id }).url)}>
                                            <Undo2 className="mr-2 h-4 w-4" />
                                            Demander la résiliation
                                        </DropdownMenuItem>
                                    )}
                                    {hasPermission('credit.destroy') && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                                onClick={() => onDelete?.(request)}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Supprimer
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </div>

            <Separator className="bg-border/40" />

            <div className="flex flex-wrap items-center gap-x-8 gap-y-2 bg-muted/30 px-6 py-3 transition-colors group-hover:bg-muted/50">
                {hasFinancials ? (
                    <>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                Remboursements :
                            </span>
                            <span className="text-xs font-bold text-foreground">
                                {request.paid_installments_count || 0} effectuée(s)
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                Dernier :
                            </span>
                            <span className="text-xs font-bold text-foreground">{lastRepayment}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                Reste à payer :
                            </span>
                            <span className="text-xs font-bold text-primary">{remainingToPay}</span>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                Début :
                            </span>
                            <span className="text-xs font-bold text-foreground">{formatDate(request.start_date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                Fin :
                            </span>
                            <span className="text-xs font-bold text-foreground">{formatDate(request.end_date)}</span>
                        </div>
                    </>
                )}
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                        Garant :
                    </span>
                    <span className="text-xs font-bold text-foreground">
                        {request.guarantor ? `${request.guarantor.first_name} ${request.guarantor.last_name}` : 'Aucun'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                        Créé le :
                    </span>
                    <span className="text-xs font-bold text-foreground">{formatDate(request.created_at)}</span>
                </div>
                <div className="ml-auto hidden md:block">
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary/60" />
                </div>
            </div>
        </div>
    );
});

CreditCard.displayName = 'CreditCard';

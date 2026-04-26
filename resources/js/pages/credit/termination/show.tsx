import { Head, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft, CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import CreditLayout from '@/layouts/credit/credit-layout';
import { cn } from '@/lib/utils';
import terminationRequests from '@/routes/credit/termination-requests/index';
import type { BreadcrumbItem } from '@/types';

interface TerminationRequest {
    id: number;
    requested_date: string;
    reason: string;
    description: string | null;
    status: 'pending' | 'approved' | 'rejected';
    processed_at: string | null;
    rejection_reason: string | null;
    created_at: string;
    user: {
        name: string;
    };
    processed_by: {
        name: string;
    } | null;
    credit_request: {
        id: number;
        code: string;
        student: {
            first_name: string;
            last_name: string;
        };
    };
}

interface ShowProps {
    terminationRequest: TerminationRequest;
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

export default function Show({ terminationRequest, breadcrumbs }: ShowProps) {
    const [isRejectModalOpen, setIsRejectModalOpen] = React.useState(false);
    const [isApproveModalOpen, setIsApproveModalOpen] = React.useState(false);
    const { data, setData, post, processing, errors } = useForm({
        rejection_reason: '',
    });

    const formatDate = (dateString: string) => {
        return format(new Date(dateString), 'dd MMMM yyyy', { locale: fr });
    };

    const handleApprove = (e: React.FormEvent) => {
        e.preventDefault();
        post(terminationRequests.approve({ loanTerminationRequest: terminationRequest.id }).url, {
            onSuccess: () => setIsApproveModalOpen(false),
        });
    };

    const handleReject = (e: React.FormEvent) => {
        e.preventDefault();
        post(terminationRequests.reject({ loanTerminationRequest: terminationRequest.id }).url, {
            onSuccess: () => setIsRejectModalOpen(false),
        });
    };

    const status = statusConfig[terminationRequest.status];
    const StatusIcon = status.icon;

    return (
        <CreditLayout breadcrumbs={breadcrumbs} hideSidebar>
            <Head title={`Demande de résiliation - ${terminationRequest.credit_request.code}`} />

            <div className="mx-auto max-w-4xl space-y-6 py-6">
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.history.back()}
                        className="gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Retour
                    </Button>

                    <Badge
                        variant="outline"
                        className={cn('flex items-center gap-1.5 px-3 py-1 text-sm font-medium', status.className)}
                    >
                        <StatusIcon className="h-4 w-4" />
                        {status.label}
                    </Badge>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Détails de la demande</CardTitle>
                                <CardDescription>
                                    Soumise par {terminationRequest.user.name} le {formatDate(terminationRequest.created_at)}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <Label className="text-muted-foreground">Dossier</Label>
                                        <p className="font-semibold">{terminationRequest.credit_request.code}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Étudiant</Label>
                                        <p className="font-semibold">
                                            {terminationRequest.credit_request.student.first_name}{' '}
                                            {terminationRequest.credit_request.student.last_name}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Date de résiliation demandée</Label>
                                        <p className="font-semibold">{formatDate(terminationRequest.requested_date)}</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Motif</Label>
                                    <p className="font-medium text-lg">{terminationRequest.reason}</p>
                                </div>

                                {terminationRequest.description && (
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground">Description</Label>
                                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
                                            {terminationRequest.description}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {terminationRequest.status !== 'pending' && (
                            <Card className={cn(
                                'border-l-4',
                                terminationRequest.status === 'approved' ? 'border-l-emerald-500' : 'border-l-red-500'
                            )}>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">Traitement de la demande</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2 text-sm">
                                        <div>
                                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Traité par</Label>
                                            <p className="font-medium">{terminationRequest.processed_by?.name || 'Système'}</p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Le</Label>
                                            <p className="font-medium">{terminationRequest.processed_at ? formatDate(terminationRequest.processed_at) : '—'}</p>
                                        </div>
                                    </div>
                                    {terminationRequest.rejection_reason && (
                                        <div className="rounded-lg bg-red-50 p-4 dark:bg-red-950/20">
                                            <Label className="text-xs text-red-600 dark:text-red-400 uppercase tracking-wider">Motif du rejet</Label>
                                            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                                                {terminationRequest.rejection_reason}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <div className="space-y-6">
                        {terminationRequest.status === 'pending' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Actions</CardTitle>
                                    <CardDescription>Décidez du sort de cette demande.</CardDescription>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-3">
                                    <Dialog open={isApproveModalOpen} onOpenChange={setIsApproveModalOpen}>
                                        <DialogTrigger asChild>
                                            <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                                Approuver
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <form onSubmit={handleApprove}>
                                                <DialogHeader>
                                                    <DialogTitle>Approuver la résiliation</DialogTitle>
                                                    <DialogDescription>
                                                        Êtes-vous sûr de vouloir approuver cette demande de résiliation ?
                                                        Cela changera le statut du dossier de prêt en "Rejeté".
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <DialogFooter className="mt-4">
                                                    <Button type="button" variant="outline" onClick={() => setIsApproveModalOpen(false)}>
                                                        Annuler
                                                    </Button>
                                                    <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={processing}>
                                                        {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                        Confirmer l'approbation
                                                    </Button>
                                                </DialogFooter>
                                            </form>
                                        </DialogContent>
                                    </Dialog>

                                    <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" className="w-full text-red-600 hover:bg-red-50 hover:text-red-700">
                                                <XCircle className="mr-2 h-4 w-4" />
                                                Rejeter
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <form onSubmit={handleReject}>
                                                <DialogHeader>
                                                    <DialogTitle>Rejeter la demande</DialogTitle>
                                                    <DialogDescription>
                                                        Veuillez indiquer la raison du rejet de cette demande de résiliation.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="py-4 space-y-2">
                                                    <Label htmlFor="rejection_reason">Raison du rejet</Label>
                                                    <Textarea
                                                        id="rejection_reason"
                                                        value={data.rejection_reason}
                                                        onChange={(e) => setData('rejection_reason', e.target.value)}
                                                        placeholder="Expliquez pourquoi la demande est rejetée..."
                                                        required
                                                    />
                                                    {errors.rejection_reason && <p className="text-xs text-destructive">{errors.rejection_reason}</p>}
                                                </div>
                                                <DialogFooter>
                                                    <Button type="button" variant="outline" onClick={() => setIsRejectModalOpen(false)}>
                                                        Annuler
                                                    </Button>
                                                    <Button type="submit" variant="destructive" disabled={processing}>
                                                        {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                        Confirmer le rejet
                                                    </Button>
                                                </DialogFooter>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Informations</CardTitle>
                            </CardHeader>
                            <CardContent className="text-xs text-muted-foreground space-y-4">
                                <p>
                                    Une fois approuvée, le dossier de prêt sera considéré comme résilié à la date indiquée.
                                </p>
                                <p>
                                    L'utilisateur ayant fait la demande sera notifié de votre décision.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </CreditLayout>
    );
}

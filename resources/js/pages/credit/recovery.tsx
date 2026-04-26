import { Head, useForm, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    Calendar as CalendarIcon,
    CheckCircle2,
    Clock,
    DollarSign,
    ExternalLink,
    Loader2,
    PlusCircle,
    Search,
    ShieldCheck,
    X,
} from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import CreditLayout from '@/layouts/credit/credit-layout';
import { cn } from '@/lib/utils';
import recovery from '@/routes/credit/recovery';

interface Installment {
    id: number;
    installment_number: number;
    due_date: string;
    total_amount: string | number;
    status: string;
    credit_request: {
        id: number;
        code: string;
        student: {
            first_name: string;
            last_name: string;
        };
        credit_type: {
            name: string;
        };
    };
}

interface PendingRepayment {
    id: number;
    amount: string | number;
    repayment_date: string;
    payment_method: string;
    reference: string;
    status: string;
    proof_url: string;
    credit_request: {
        id: number;
        code: string;
        student: {
            first_name: string;
            last_name: string;
        };
    };
    installment: {
        id: number;
        installment_number: number;
    };
}

interface RecoveryProps {
    installments: Installment[];
    pendingRepayments: PendingRepayment[];
}

const paymentMethodLabels: Record<string, string> = {
    virement: 'Virement',
    depot: 'Espèce',
    cheque: 'Chèque',
    mobile_money: 'Mobile Money',
};

export default function Recovery({ installments, pendingRepayments }: RecoveryProps) {
    const [selectedInstallment, setSelectedInstallment] = React.useState<Installment | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [activeTab, setActiveTab] = React.useState<'pending' | 'installments'>('installments');

    const { data, setData, post, processing, reset, errors } = useForm<{
        amount: string;
        repayment_date: string;
        payment_method: string;
        reference: string;
        notes: string;
        proof: File | null;
    }>({
        amount: '',
        repayment_date: new Date().toISOString().split('T')[0],
        payment_method: 'virement',
        reference: '',
        notes: '',
        proof: null,
    });

    const formatCurrency = (amount: string | number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(Number(amount));
    };

    const formatDate = (dateString: string) => {
        return format(new Date(dateString), 'dd MMM yyyy', { locale: fr });
    };

    const handleOpenPaymentModal = (installment: Installment) => {
        setSelectedInstallment(installment);
        setData('amount', installment.total_amount.toString());
        setIsPaymentModalOpen(true);
    };

    const submitRepayment = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedInstallment) {
            return;
        }

        post(recovery.record({ installment: selectedInstallment.id }).url, {
            onSuccess: () => {
                setIsPaymentModalOpen(false);
                reset();
            },
        });
    };

    const validateRepayment = (repaymentId: number) => {
        router.post(recovery.validateRepayment({ repayment: repaymentId }).url);
    };

    const rejectRepayment = (repaymentId: number) => {
        if (confirm('Êtes-vous sûr de vouloir rejeter ce recouvrement ?')) {
            router.post(recovery.rejectRepayment({ repayment: repaymentId }).url);
        }
    };

    const filteredInstallments = installments.filter(
        (i) =>
            `${i.credit_request.student.first_name} ${i.credit_request.student.last_name}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            i.credit_request.code.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const totalDue = installments.reduce((sum, i) => sum + Number(i.total_amount), 0);

    return (
        <CreditLayout breadcrumbs={[]} hideSidebar>
            <Head title="Recouvrement" />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Recouvrement</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Gérez les paiements et validez les recouvrements en attente.
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Card className="border-none bg-blue-50/40 shadow-none dark:bg-blue-950/15">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Échéances en cours</p>
                                    <p className="mt-2 text-3xl font-bold tracking-tight text-blue-900 dark:text-blue-100">{installments.length}</p>
                                    <p className="mt-1 text-xs text-blue-500/70 dark:text-blue-400/60">dossiers actifs</p>
                                </div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
                                    <CalendarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none bg-amber-50/40 shadow-none dark:bg-amber-950/15">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Validations en attente</p>
                                    <p className="mt-2 text-3xl font-bold tracking-tight text-amber-900 dark:text-amber-100">{pendingRepayments.length}</p>
                                    <p className="mt-1 text-xs text-amber-500/70 dark:text-amber-400/60">à traiter</p>
                                </div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
                                    <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none bg-emerald-50/40 shadow-none dark:bg-emerald-950/15">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Montant total dû</p>
                                    <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-900 dark:text-emerald-100">{formatCurrency(totalDue)}</p>
                                    <p className="mt-1 text-xs text-emerald-500/70 dark:text-emerald-400/60">à recouvrir</p>
                                </div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                                    <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 rounded-lg bg-muted/30 p-1">
                    <button
                        onClick={() => setActiveTab('installments')}
                        className={cn(
                            'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all',
                            activeTab === 'installments'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        <CalendarIcon className="h-4 w-4" />
                        Échéances à recouvrir
                        <span className="ml-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                            {installments.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={cn(
                            'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all',
                            activeTab === 'pending'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        <ShieldCheck className="h-4 w-4" />
                        Validations en attente
                        {pendingRepayments.length > 0 && (
                            <span className="ml-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-600">
                                {pendingRepayments.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Tab: Échéances */}
                {activeTab === 'installments' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 duration-300">
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Rechercher un étudiant ou code..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-9 pl-9"
                            />
                        </div>

                        <div className="overflow-hidden rounded-lg border border-border/30 bg-card">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                                        <TableHead className="font-semibold">Étudiant</TableHead>
                                        <TableHead className="font-semibold">Type de crédit</TableHead>
                                        <TableHead className="font-semibold">Échéance</TableHead>
                                        <TableHead className="text-right font-semibold">Montant</TableHead>
                                        <TableHead className="text-right font-semibold">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredInstallments.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-32 text-center">
                                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                    <CheckCircle2 className="h-8 w-8 opacity-20" />
                                                    <p className="text-sm">Aucune échéance trouvée.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredInstallments.map((installment) => {
                                            const isOverdue = new Date(installment.due_date) < new Date();

                                            return (
                                                <TableRow key={installment.id} className="group transition-colors hover:bg-muted/30">
                                                    <TableCell>
                                                        <div>
                                                            <p className="text-sm font-medium">
                                                                {installment.credit_request.student.first_name}{' '}
                                                                {installment.credit_request.student.last_name}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">{installment.credit_request.code}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="text-[10px] font-medium">
                                                            {installment.credit_request.credit_type.name}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <span className={cn('text-sm', isOverdue && 'font-medium text-red-600')}>
                                                                {formatDate(installment.due_date)}
                                                            </span>
                                                            {isOverdue && (
                                                                <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
                                                                    En retard
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-muted-foreground">
                                                            Échéance #{installment.installment_number}
                                                        </p>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <span className="text-sm font-bold">{formatCurrency(installment.total_amount)}</span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            size="sm"
                                                            className="h-8 px-3 opacity-70 transition-opacity group-hover:opacity-100"
                                                            onClick={() => handleOpenPaymentModal(installment)}
                                                        >
                                                            <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                                                            Saisir
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
                )}

                {/* Tab: Validations en attente */}
                {activeTab === 'pending' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {pendingRepayments.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border/30 bg-muted/10 py-16">
                                <CheckCircle2 className="h-12 w-12 text-green-500/30" />
                                <p className="text-sm text-muted-foreground">Aucune validation en attente. Tout est à jour !</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {pendingRepayments.map((repayment) => (
                                    <Card
                                        key={repayment.id}
                                        className="group border-border/30 shadow-none transition-all hover:shadow-sm"
                                    >
                                        <CardContent className="p-0">
                                            {/* Card header */}
                                            <div className="flex items-start justify-between border-b border-border/20 p-4">
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-semibold">
                                                        {repayment.credit_request.student.first_name}{' '}
                                                        {repayment.credit_request.student.last_name}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                                        {repayment.credit_request.code} · Échéance #{repayment.installment.installment_number}
                                                    </p>
                                                </div>
                                                <Badge variant="secondary" className="shrink-0 text-[10px] font-medium">
                                                    {paymentMethodLabels[repayment.payment_method] || repayment.payment_method}
                                                </Badge>
                                            </div>

                                            {/* Card body */}
                                            <div className="space-y-3 p-4">
                                                <div className="flex items-baseline justify-between">
                                                    <span className="text-2xl font-bold tracking-tight">
                                                        {formatCurrency(repayment.amount)}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                    <span>{formatDate(repayment.repayment_date)}</span>
                                                    <span>Réf: {repayment.reference || '—'}</span>
                                                </div>

                                                {repayment.proof_url && (
                                                    <a
                                                        href={repayment.proof_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline"
                                                    >
                                                        <ExternalLink className="h-3 w-3" />
                                                        Voir la preuve de paiement
                                                    </a>
                                                )}
                                            </div>

                                            {/* Card actions */}
                                            <div className="flex items-center gap-2 border-t border-border/20 p-3">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={() => rejectRepayment(repayment.id)}
                                                >
                                                    <X className="mr-1.5 h-3.5 w-3.5" />
                                                    Rejeter
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="h-8 flex-1 bg-green-600 hover:bg-green-700"
                                                    onClick={() => validateRepayment(repayment.id)}
                                                >
                                                    <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                                                    Valider
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal de saisie */}
            <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={submitRepayment}>
                        <DialogHeader>
                            <DialogTitle>Saisir un recouvrement</DialogTitle>
                            <DialogDescription>
                                Enregistrez un versement pour{' '}
                                <span className="font-medium text-foreground">
                                    {selectedInstallment?.credit_request.student.first_name}{' '}
                                    {selectedInstallment?.credit_request.student.last_name}
                                </span>{' '}
                                — Échéance #{selectedInstallment?.installment_number}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="amount">Montant versé</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="amount"
                                        type="number"
                                        value={data.amount}
                                        onChange={(e) => setData('amount', e.target.value)}
                                        className="pl-9"
                                        required
                                    />
                                </div>
                                {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="repayment_date">Date du versement</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                'w-full justify-start text-left font-normal',
                                                !data.repayment_date && 'text-muted-foreground',
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {data.repayment_date ? (
                                                format(new Date(data.repayment_date), 'PPP', { locale: fr })
                                            ) : (
                                                <span>Sélectionnez une date</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={data.repayment_date ? new Date(data.repayment_date) : undefined}
                                            onSelect={(date) => setData('repayment_date', date ? format(date, 'yyyy-MM-dd') : '')}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                {errors.repayment_date && <p className="text-xs text-destructive">{errors.repayment_date}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="payment_method">Mode de paiement</Label>
                                <Select value={data.payment_method} onValueChange={(value) => setData('payment_method', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner un mode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="virement">Virement bancaire</SelectItem>
                                        <SelectItem value="depot">Dépôt espèce</SelectItem>
                                        <SelectItem value="cheque">Chèque</SelectItem>
                                        <SelectItem value="mobile_money">Mobile Money</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.payment_method && <p className="text-xs text-destructive">{errors.payment_method}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="reference">Référence (N° Transaction/Pièce)</Label>
                                <Input
                                    id="reference"
                                    value={data.reference}
                                    onChange={(e) => setData('reference', e.target.value)}
                                    placeholder="Ex: TR-9842..."
                                />
                                {errors.reference && <p className="text-xs text-destructive">{errors.reference}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="notes">Notes complémentaires</Label>
                                <Textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Informations additionnelles..."
                                    rows={2}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="proof">
                                    Preuve de paiement <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="proof"
                                    type="file"
                                    accept=".jpeg,.jpg,.png,.pdf"
                                    onChange={(e) => setData('proof', e.target.files ? e.target.files[0] : null)}
                                    required
                                />
                                <p className="text-[10px] text-muted-foreground">JPG, PNG ou PDF — 2 Mo max.</p>
                                {errors.proof && <p className="text-xs text-destructive">{errors.proof}</p>}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
                                Annuler
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Enregistrer
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </CreditLayout>
    );
}

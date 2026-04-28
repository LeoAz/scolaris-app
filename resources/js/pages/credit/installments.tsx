import { Head, Link, useForm, router } from '@inertiajs/react';
import {
    Calendar,
    DollarSign,
    CheckCircle,
    Clock,
    PlusCircle,
    ArrowLeft,
    Loader2,
    TrendingDown,
    User,
    CreditCard as CreditCardIcon,
    FileText,
    History,
    ExternalLink,
    Check,
    X,
    Eye
} from 'lucide-react';
import React from 'react';

import {
    Alert,
    AlertDescription,
    AlertTitle,
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Frame,
    FrameDescription,
    FrameHeader,
    FramePanel,
    FrameTitle,
} from '@/components/ui/frame';
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
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import credit from '@/routes/credit';
import type { BreadcrumbItem as BreadcrumbItemType, CreditRequest, CreditRequestInstallment, CreditRequestRepayment } from '@/types';

interface InstallmentsProps {
    creditRequest: CreditRequest & {
        installments: CreditRequestInstallment[];
        repayments: CreditRequestRepayment[];
        student: { first_name: string; last_name: string };
        credit_type: { name: string; rate: number; duration_months: number };
        total_repaid: number;
    };
    nextInstallment: CreditRequestInstallment | null;
    breadcrumbs: BreadcrumbItemType[];
}

export default function Installments({ creditRequest, nextInstallment }: Omit<InstallmentsProps, 'breadcrumbs'>) {
    const [selectedInstallment, setSelectedInstallment] = React.useState<CreditRequestInstallment | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false);
    const [selectedRepayment, setSelectedRepayment] = React.useState<CreditRequestRepayment | null>(null);
    const [isValidationSheetOpen, setIsValidationSheetOpen] = React.useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        amount: '',
        repayment_date: new Date().toISOString().split('T')[0],
        payment_method: 'virement',
        reference: '',
        notes: '',
        proof: null as File | null,
    });

    const formatCurrency = (amount: string | number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(Number(amount));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    };

    const handleOpenPaymentModal = (installment: CreditRequestInstallment) => {
        setSelectedInstallment(installment);
        setData('amount', installment.total_amount.toString());
        setIsPaymentModalOpen(true);
    };

    const handleSubmitPayment = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedInstallment) {
            return;
        }

        post(credit.installments.repayments.store({
            creditRequest: creditRequest.id,
            installment: selectedInstallment.id
        }).url, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setIsPaymentModalOpen(false);
                reset();
                setSelectedInstallment(null);
            },
        });
    };

    return (
        <>
            <Head title={`Échéancier - ${creditRequest.code}`} />

            <div className="flex flex-col gap-8 py-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <CreditCardIcon className="h-8 w-8 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{creditRequest.code}</h1>
                            <div className="flex items-center gap-2 text-muted-foreground mt-1">
                                <User className="h-4 w-4" />
                                <span>{creditRequest.student.first_name} {creditRequest.student.last_name}</span>
                                <span className="text-border mx-1">|</span>
                                <Badge variant="secondary">{creditRequest.credit_type.name}</Badge>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" asChild>
                            <Link href={credit.show({ creditRequest: creditRequest.id }).url}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Retour au dossier
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Next Installment Banner */}
                {nextInstallment && (
                    <div className="px-6">
                        <Alert className="bg-indigo-50 border-indigo-100 text-indigo-900 py-4">
                            <Calendar className="h-5 w-5 text-indigo-600" />
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
                                <div>
                                    <AlertTitle className="text-indigo-900 font-bold text-base">Prochain remboursement</AlertTitle>
                                    <AlertDescription className="text-indigo-700">
                                        Une échéance de <span className="font-bold">{formatCurrency(nextInstallment.total_amount)}</span> est prévue pour le <span className="font-bold">{formatDate(nextInstallment.due_date)}</span>.
                                    </AlertDescription>
                                </div>
                                <Button
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
                                    onClick={() => handleOpenPaymentModal(nextInstallment)}
                                >
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Régler maintenant
                                </Button>
                            </div>
                        </Alert>
                    </div>
                )}

                {/* Key Metrics Section */}
                <div className="grid gap-6 md:grid-cols-4 px-6">
                    <Card className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs uppercase font-semibold">Montant Prêté</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold">{formatCurrency(creditRequest.amount_requested)}</div>
                            <p className="text-xs text-muted-foreground mt-1">{creditRequest.credit_type.duration_months} mois à {creditRequest.credit_type.rate}%</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-orange-500">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs uppercase font-semibold">Reste à payer</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold text-orange-600">
                                {formatCurrency(
                                    creditRequest.installments.reduce((acc, inst) =>
                                        inst.status === 'pending' ? acc + Number(inst.total_amount) : acc, 0
                                    )
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {creditRequest.installments.filter(i => i.status === 'pending').length} mensualités restantes
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-emerald-500">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs uppercase font-semibold text-emerald-700">Déjà remboursé</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold text-emerald-600">
                                {formatCurrency(creditRequest.total_repaid)}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 mt-1">
                                <TrendingDown className="h-3.5 w-3.5" />
                                {((Number(creditRequest.total_repaid) / Number(creditRequest.amount_requested)) * 100).toFixed(1)}% du capital réglé
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-indigo-500">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs uppercase font-semibold text-indigo-700">En attente de validation</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold text-indigo-600">
                                {formatCurrency(
                                    creditRequest.repayments?.reduce((acc, rep) =>
                                        rep.status === 'pending' ? acc + Number(rep.amount) : acc, 0
                                    ) || 0
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-700 mt-1">
                                <Clock className="h-3.5 w-3.5" />
                                {creditRequest.repayments?.filter(r => r.status === 'pending').length || 0} remboursement(s) à vérifier
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Table Section */}
                <div className="px-6">
                    <Frame>
                        <FrameHeader className="flex flex-row items-center justify-between">
                            <div>
                                <FrameTitle>Tableau d'amortissement</FrameTitle>
                                <FrameDescription>Évolution des remboursements au fil des mois</FrameDescription>
                            </div>
                        </FrameHeader>
                        <FramePanel>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead className="w-[80px]">N°</TableHead>
                                            <TableHead>Échéance</TableHead>
                                            <TableHead className="text-right">Capital dû</TableHead>
                                            <TableHead className="text-right">Amortissement</TableHead>
                                            <TableHead className="text-right">Intérêts</TableHead>
                                            <TableHead className="text-right font-bold text-foreground">Mensualité</TableHead>
                                            <TableHead className="text-center">Statut</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {creditRequest.installments.map((installment) => {
                                            const isNext = nextInstallment?.id === installment.id;

                                            return (
                                                <TableRow
                                                    key={installment.id}
                                                    className={cn(
                                                        "transition-colors",
                                                        isNext && "bg-indigo-50/50 hover:bg-indigo-50",
                                                        installment.status === 'paid' && "text-muted-foreground/80"
                                                    )}
                                                >
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-2">
                                                            {isNext && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" title="Prochaine échéance"></div>}
                                                            {installment.installment_number}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                                            {formatDate(installment.due_date)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-xs">{formatCurrency(installment.remaining_principal)}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(installment.principal_amount)}</TableCell>
                                                    <TableCell className="text-right text-orange-600/90">{formatCurrency(installment.interest_amount)}</TableCell>
                                                    <TableCell className={cn(
                                                        "text-right font-bold",
                                                        isNext ? "text-indigo-700" : "text-foreground"
                                                    )}>
                                                        {formatCurrency(installment.total_amount)}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {installment.status === 'paid' ? (
                                                            <Badge variant="green" className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 gap-1">
                                                                <CheckCircle className="h-3 w-3" />
                                                                Payé
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="orange" className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100 gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {isNext ? 'À régler' : 'En attente'}
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {installment.status === 'pending' && (
                                                            <Button
                                                                variant={isNext ? "default" : "outline"}
                                                                size="sm"
                                                                className={cn("h-8 gap-1", isNext && "bg-indigo-600 hover:bg-indigo-700")}
                                                                onClick={() => handleOpenPaymentModal(installment)}
                                                            >
                                                                <PlusCircle className="h-4 w-4" />
                                                                Régler
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </FramePanel>
                    </Frame>
                </div>

                {/* Repayments History Section */}
                <div className="px-6 pb-6">
                    <Frame>
                        <FrameHeader>
                            <div className="flex items-center gap-3">
                                <History className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <FrameTitle>Historique des remboursements</FrameTitle>
                                    <FrameDescription>Suivi des paiements effectués et de leur validation</FrameDescription>
                                </div>
                            </div>
                        </FrameHeader>
                        <FramePanel>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead>Date</TableHead>
                                            <TableHead>Échéance</TableHead>
                                            <TableHead>Mode</TableHead>
                                            <TableHead>Référence</TableHead>
                                            <TableHead className="text-right">Montant</TableHead>
                                            <TableHead className="text-center">Statut</TableHead>
                                            <TableHead className="text-right">Preuve</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {creditRequest.repayments && creditRequest.repayments.length > 0 ? (
                                            creditRequest.repayments.map((repayment) => (
                                                <TableRow key={repayment.id}>
                                                    <TableCell className="whitespace-nowrap font-medium">
                                                        {formatDate(repayment.repayment_date)}
                                                    </TableCell>
                                                    <TableCell>
                                                        Échéance n°{repayment.installment?.installment_number}
                                                    </TableCell>
                                                    <TableCell className="capitalize">
                                                        {repayment.payment_method.replace('_', ' ')}
                                                    </TableCell>
                                                    <TableCell className="font-mono text-xs">
                                                        {repayment.reference || '—'}
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold">
                                                        {formatCurrency(repayment.amount)}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {repayment.status === 'validated' ? (
                                                            <Badge variant="green" className="bg-green-100 text-green-700 border-green-200">
                                                                Validé
                                                            </Badge>
                                                        ) : repayment.status === 'rejected' ? (
                                                            <Badge variant="destructive">Rejeté</Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="animate-pulse">En attente</Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {repayment.proof_url ? (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0"
                                                                asChild
                                                            >
                                                                <a href={repayment.proof_url} target="_blank" rel="noopener noreferrer">
                                                                    <FileText className="h-4 w-4 text-blue-600" />
                                                                </a>
                                                            </Button>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground italic">En cours...</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 gap-1"
                                                            onClick={() => {
                                                                setSelectedRepayment(repayment);
                                                                setIsValidationSheetOpen(true);
                                                            }}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                            Détails
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                                    Aucun remboursement enregistré pour le moment.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </FramePanel>
                    </Frame>
                </div>
            </div>

            {/* Payment Modal */}
            <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Enregistrer un règlement</DialogTitle>
                        <DialogDescription>
                            Confirmation du paiement pour l'échéance n°{selectedInstallment?.installment_number} du {selectedInstallment && formatDate(selectedInstallment.due_date)}.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmitPayment} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount">Montant réglé</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        value={data.amount}
                                        onChange={(e) => setData('amount', e.target.value)}
                                        className="pl-9 font-semibold"
                                        required
                                    />
                                </div>
                                {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="repayment_date">Date du règlement</Label>
                                <Input
                                    id="repayment_date"
                                    type="date"
                                    value={data.repayment_date}
                                    onChange={(e) => setData('repayment_date', e.target.value)}
                                    required
                                />
                                {errors.repayment_date && <p className="text-xs text-destructive">{errors.repayment_date}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="payment_method">Moyen de paiement</Label>
                            <Select
                                value={data.payment_method}
                                onValueChange={(value) => setData('payment_method', value)}
                            >
                                <SelectTrigger id="payment_method">
                                    <SelectValue placeholder="Sélectionner un mode" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="virement">Virement bancaire</SelectItem>
                                    <SelectItem value="especes">Espèces</SelectItem>
                                    <SelectItem value="cheque">Chèque</SelectItem>
                                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.payment_method && <p className="text-xs text-destructive">{errors.payment_method}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reference">Référence de transaction</Label>
                            <Input
                                id="reference"
                                value={data.reference}
                                onChange={(e) => setData('reference', e.target.value)}
                                placeholder="N° de virement, chèque, etc."
                            />
                            {errors.reference && <p className="text-xs text-destructive">{errors.reference}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="proof">Preuve de paiement (Obligatoire)</Label>
                            <Input
                                id="proof"
                                type="file"
                                onChange={(e) => setData('proof', e.target.files?.[0] || null)}
                                required
                            />
                            <p className="text-[10px] text-muted-foreground">Format accepté : PDF, JPG, PNG (Max 10Mo)</p>
                            {errors.proof && <p className="text-xs text-destructive">{errors.proof}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                placeholder="Observations éventuelles..."
                                className="resize-none"
                            />
                            {errors.notes && <p className="text-xs text-destructive">{errors.notes}</p>}
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
                                Annuler
                            </Button>
                            <Button type="submit" disabled={processing} className="bg-blue-600 hover:bg-blue-700">
                                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Soumettre le règlement
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Validation Sheet */}
            <Sheet open={isValidationSheetOpen} onOpenChange={setIsValidationSheetOpen}>
                <SheetContent className="overflow-y-auto">
                    <SheetHeader className="mb-6">
                        <SheetTitle>Détails du remboursement</SheetTitle>
                        <SheetDescription>
                            Re-contrôle et validation du paiement effectué
                        </SheetDescription>
                    </SheetHeader>

                    {selectedRepayment && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground uppercase font-semibold">Montant</span>
                                    <p className="text-lg font-bold">{formatCurrency(selectedRepayment.amount)}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground uppercase font-semibold">Date</span>
                                    <p className="text-lg font-bold">{formatDate(selectedRepayment.repayment_date)}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground uppercase font-semibold">Mode</span>
                                    <p className="font-medium capitalize">{selectedRepayment.payment_method.replace('_', ' ')}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground uppercase font-semibold">Référence</span>
                                    <p className="font-mono">{selectedRepayment.reference || '—'}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <span className="text-xs text-muted-foreground uppercase font-semibold">Preuve de paiement</span>
                                {selectedRepayment.proof_url ? (
                                    <div className="rounded-xl border bg-muted/20 p-4 flex flex-col items-center gap-4">
                                        <div className="flex items-center gap-3 w-full">
                                            <FileText className="h-10 w-10 text-blue-600" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">Preuve_Remboursement_{selectedRepayment.id}</p>
                                                <p className="text-xs text-muted-foreground font-mono">PDF / Image</p>
                                            </div>
                                            <Button variant="outline" size="sm" asChild>
                                                <a href={selectedRepayment.proof_url} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            </Button>
                                        </div>
                                        <div className="w-full aspect-[4/3] rounded-lg border bg-white overflow-hidden flex items-center justify-center">
                                            {selectedRepayment.proof_url.match(/\.(jpg|jpeg|png)$/i) ? (
                                                <img src={selectedRepayment.proof_url} alt="Preuve" className="max-w-full max-h-full object-contain" />
                                            ) : (
                                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                    <FileText className="h-12 w-12" />
                                                    <p className="text-sm">Prévisualisation non disponible pour ce format</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-dashed p-8 flex flex-col items-center justify-center text-muted-foreground italic">
                                        Traitement du document en cours...
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <span className="text-xs text-muted-foreground uppercase font-semibold">Notes</span>
                                <div className="p-3 bg-muted/30 rounded-lg text-sm italic">
                                    {selectedRepayment.notes || 'Aucune note particulière.'}
                                </div>
                            </div>

                            {selectedRepayment.status === 'pending' && (
                                <div className="flex flex-col gap-3 pt-4 border-t">
                                    <div className="flex gap-3">
                                        <Button
                                            className="flex-1 bg-green-600 hover:bg-green-700"
                                            onClick={() => {
                                                if (confirm('Voulez-vous vraiment valider ce remboursement ?')) {
                                                    router.post(credit.installments.repayments.validate({
                                                        creditRequest: creditRequest.id,
                                                        repayment: selectedRepayment.id
                                                    }).url, {}, {
                                                        preserveScroll: true,
                                                        preserveState: true,
                                                        onSuccess: () => setIsValidationSheetOpen(false)
                                                    });
                                                }
                                            }}
                                        >
                                            <Check className="mr-2 h-4 w-4" />
                                            Valider le paiement
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            className="flex-1"
                                            onClick={() => {
                                                const reason = prompt('Motif du rejet :');

                                                if (reason) {
                                                    router.post(credit.installments.repayments.reject({
                                                        creditRequest: creditRequest.id,
                                                        repayment: selectedRepayment.id
                                                    }).url, { reason }, {
                                                        preserveScroll: true,
                                                        preserveState: true,
                                                        onSuccess: () => setIsValidationSheetOpen(false)
                                                    });
                                                }
                                            }}
                                        >
                                            <X className="mr-2 h-4 w-4" />
                                            Rejeter
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-center text-muted-foreground">
                                        La validation mettra à jour le solde du prêt et le statut de l'échéance correspondante.
                                    </p>
                                </div>
                            )}

                            {selectedRepayment.status === 'validated' && (
                                <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex items-center gap-3 text-green-700">
                                    <CheckCircle className="h-5 w-5" />
                                    <div className="text-xs">
                                        <p className="font-bold uppercase">Remboursement Validé</p>
                                        <p>Ce paiement a été vérifié et approuvé par un contrôleur.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </>
    );
}

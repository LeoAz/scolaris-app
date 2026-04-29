import { Head, useForm, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    Briefcase,
    Calendar,
    CheckCircle,
    ChevronDown,
    CreditCard,
    Eye,
    FileText,
    Globe,
    Info,
    Loader2,
    Minus,
    Plus,
    ShieldCheck,
    Trash2,
    Upload,
    User,
    UserCheck,
    XCircle,
    ChevronRight,
} from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

import { validateRequest } from '@/actions/App/Http/Controllers/Credit/CreditRequestController';
import CreditDocumentUpload from '@/components/credit/credit-document-upload';
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert"
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Frame,
    FrameDescription,
    FrameHeader,
    FramePanel,
    FrameTitle
} from '@/components/ui/frame';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

import credit, { submit, resiliate, reject, summary } from '@/routes/credit';
import { deleteMethod } from '@/routes/credit/documents';
import terminationRequests from '@/routes/credit/termination-requests/index';
import type { BreadcrumbItem, CreditRequest, Media, ModelUser } from '@/types';

interface ShowProps {
    creditRequest: CreditRequest;
    breadcrumbs: BreadcrumbItem[];
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "blue" | "orange" | "green" | "purple" | "gray" }> = {
    creation: { label: 'Création', variant: 'blue' as any },
    soumis: { label: 'Soumis', variant: 'orange' as any },
    valider: { label: 'Validé', variant: 'green' as any },
    rejeter: { label: 'Rejeté', variant: 'destructive' },
    cloturer: { label: 'Clôturé', variant: 'gray' as any },
    resilie: { label: 'Résilié', variant: 'purple' as any },
};

const documentTypes = [
    { value: 'demande_pret', label: 'Demande de prêt' },
    { value: 'engagement_rembourser', label: 'Engagement à rembourser' },
    { value: 'ouverture_compte', label: 'Ouverture de compte' },
    { value: 'recu_micro_finance', label: 'Reçu de la micro-finance' },
    { value: 'recu_apport_initial', label: "Reçu de l'apport initial" },
    { value: 'passport_etudiant', label: "Passeport de l'étudiant" },
    { value: 'cni_passport_garant', label: 'CNI ou passeport du garant' },
    { value: 'ordre_virement', label: 'Ordre de virement' },
    { value: 'other', label: 'Autre' },
];

export default function Show({ creditRequest }: Omit<ShowProps, 'breadcrumbs'>) {
    const page = usePage();
    const status = statusConfig[creditRequest.status] || statusConfig.creation;

    const user = (page.props as any).auth.user as ModelUser | undefined;
    const isAdmin = user?.roles?.some((role: any) => ['Administrateur', 'Super admin'].includes(role.name));

    React.useEffect(() => {
        const flash = (page.props as any).flash;

        if (flash?.success) {
            toast.success(flash.success);
        }

        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [(page.props as any).flash?.success, (page.props as any).flash?.error]);


    const { delete: destroy, post, processing: submitting } = useForm();
    const rejectForm = useForm({
        reason: '',
    });

    const [mediaToDelete, setMediaToDelete] = React.useState<number | null>(null);
    const [showSubmitModal, setShowSubmitModal] = React.useState(false);
    const [showValidateModal, setShowValidateModal] = React.useState(false);
    const [showRejectModal, setShowRejectModal] = React.useState(false);
    const [showCloturerModal, setShowCloturerModal] = React.useState(false);

    const handleSubmit = () => {
        post(submit({ creditRequest: creditRequest.id }).url, {
            onSuccess: () => setShowSubmitModal(false),
        });
    };

    const handleValidate = () => {
        post(validateRequest({ creditRequest: creditRequest.id }).url, {
            onSuccess: () => setShowValidateModal(false),
        });
    };

    const handleReject = () => {
        rejectForm.post(reject({ creditRequest: creditRequest.id }).url, {
            onSuccess: () => {
                setShowRejectModal(false);
                rejectForm.reset();
            },
        });
    };

    const handleCloturer = () => {
        post(route('credit.cloturer', creditRequest.id), {
            onSuccess: () => setShowCloturerModal(false),
        });
    };

    const formatCurrency = (amount: string | number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(Number(amount));
    };

    const formatDate = (date: string | null | undefined) => {
        if (!date) {
            return '—';
        }

        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleAction = (action: 'submit' | 'validate' | 'resiliate' | 'reject' | 'cloturer') => {
        if (action === 'submit') {
            setShowSubmitModal(true);

            return;
        }

        if (action === 'validate') {
            setShowValidateModal(true);

            return;
        }

        if (action === 'reject') {
            setShowRejectModal(true);

            return;
        }

        if (action === 'cloturer') {
            setShowCloturerModal(true);

            return;
        }

        const routeMap = {
            validateRequest,
            resiliate
        };

        const actionRoute = (routeMap as any)[action];

        post(actionRoute({ creditRequest: creditRequest.id }).url, {
            preserveScroll: true,
            preserveState: true
        });
    };

    const handleDeleteDocument = (mediaId: number) => {
        setMediaToDelete(mediaId);
    };

    const confirmDelete = () => {
        if (mediaToDelete) {
            destroy(deleteMethod({ creditRequest: creditRequest.id, media: mediaToDelete }).url, {
                onSuccess: () => setMediaToDelete(null),
                onFinish: () => setMediaToDelete(null),
            });
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) {
            return '0 Bytes';
        }

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const [isLoadingMore, setIsLoadingMore] = React.useState(false);

    const loadMoreActivities = (e: React.MouseEvent) => {
        e.preventDefault();

        if (isLoadingMore || !creditRequest.activities?.links.next) {
            return;
        }

        setIsLoadingMore(true);

        router.get(
            creditRequest.activities.links.next,
            {},
            {
                preserveState: true,
                preserveScroll: true,
                only: ['creditRequest'],
                onFinish: () => setIsLoadingMore(false),
            }
        );
    };

    const getActivityIcon = (action: string) => {
        switch (action) {
            case 'creation':
                return <UserCheck className="h-3 w-3 text-white" />;
            case 'submission':
            case 'soumettre':
                return <Upload className="h-3 w-3 text-white" />;
            case 'validation':
            case 'valider':
                return <CheckCircle className="h-3 w-3 text-white" />;
            case 'rejection':
            case 'rejeter':
                return <XCircle className="h-3 w-3 text-white" />;
            case 'resiliation':
            case 'resilier':
                return <Trash2 className="h-3 w-3 text-white" />;
            case 'document_upload':
            case 'document_added':
                return <Plus className="h-3 w-3 text-white" />;
            case 'document_delete':
            case 'document_deleted':
                return <Minus className="h-3 w-3 text-white" />;
            default:
                return <Info className="h-3 w-3 text-white" />;
        }
    };

    const getActivityColor = (action: string) => {
        switch (action) {
            case 'creation':
                return 'bg-blue-500';
            case 'submission':
            case 'soumettre':
                return 'bg-orange-500';
            case 'validation':
            case 'valider':
                return 'bg-green-500';
            case 'rejection':
            case 'rejeter':
                return 'bg-red-500';
            case 'resiliation':
            case 'resilier':
                return 'bg-purple-500';
            case 'document_upload':
            case 'document_added':
                return 'bg-blue-400';
            case 'document_delete':
            case 'document_deleted':
                return 'bg-gray-400';
            default:
                return 'bg-slate-500';
        }
    };

    return (
        <>
            <Head title={`Détails dossier ${creditRequest.code}`} />

            <AlertDialog open={mediaToDelete !== null} onOpenChange={(open) => !open && setMediaToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={submitting}>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={submitting}
                        >
                            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showRejectModal} onOpenChange={setShowRejectModal}>
                <AlertDialogContent className="sm:max-w-[500px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-destructive" />
                            Rejet du dossier
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-4 pt-2">
                            <div>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Veuillez indiquer le motif du rejet. Ce motif sera inclus dans les notifications envoyées aux administrateurs et à l'utilisateur.
                                </p>
                                <div className="space-y-2">
                                    <Label htmlFor="reason">Motif du rejet</Label>
                                    <Textarea
                                        id="reason"
                                        placeholder="Saisissez le motif du rejet ici..."
                                        value={rejectForm.data.reason}
                                        onChange={(e) => rejectForm.setData('reason', e.target.value)}
                                        className="min-h-[100px]"
                                    />
                                    {rejectForm.errors.reason && (
                                        <p className="text-xs text-destructive">{rejectForm.errors.reason}</p>
                                    )}
                                </div>
                                <p className="text-sm font-bold text-foreground pt-4">
                                    Êtes-vous sûr de vouloir rejeter ce dossier ?
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={rejectForm.processing}>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleReject}
                            className="bg-destructive hover:bg-destructive/90 text-white"
                            disabled={rejectForm.processing}
                        >
                            {rejectForm.processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                            Confirmer le rejet
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showValidateModal} onOpenChange={setShowValidateModal}>
                <AlertDialogContent className="sm:max-w-[500px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                            Validation du dossier
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-4 pt-2" asChild>
                            <div>
                                {!creditRequest.is_complete && isAdmin ? (
                                    <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-orange-800">
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertCircle className="h-4 w-4 text-orange-600" />
                                            <span className="font-bold text-orange-900">Attention : Dossier Incomplet</span>
                                        </div>
                                        <p className="text-xs">
                                            Ce dossier ne contient pas tous les documents obligatoires. En tant qu'administrateur, vous pouvez <strong>forcer la validation</strong>, mais soyez conscient des risques.
                                        </p>
                                        <div className="mt-3 space-y-1">
                                            <p className="text-[10px] font-semibold uppercase opacity-70">Documents manquants :</p>
                                            <ul className="space-y-0.5">
                                                {creditRequest.missing_documents?.map((doc) => (
                                                    <li key={doc.type} className="flex items-center gap-1.5 text-[10px]">
                                                        <XCircle className="h-2.5 w-2.5" />
                                                        {doc.label}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-800">
                                        <p className="text-sm font-medium">
                                            Avant de valider ce dossier, veuillez confirmer les points suivants :
                                        </p>
                                    </div>
                                )}
                                <ul className="space-y-3 pt-4">
                                    <li className="flex items-start gap-3">
                                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                            <CheckCircle className="h-3.5 w-3.5" />
                                        </div>
                                        <span className={`text-sm ${!creditRequest.is_complete && isAdmin ? 'text-orange-700 font-medium' : ''}`}>
                                            {(!creditRequest.is_complete && isAdmin) ? 'Attention : Certains documents obligatoires sont manquants.' : 'Tous les documents obligatoires ont été fournis et sont valides.'}
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                            <CheckCircle className="h-3.5 w-3.5" />
                                        </div>
                                        <span className="text-sm">Toutes les informations sur l'étudiant et le garant ont été passées en revue et vérifiées.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                            <CheckCircle className="h-3.5 w-3.5" />
                                        </div>
                                        <span className="text-sm">Le tableau d'amortissement sera automatiquement généré suite à cette validation.</span>
                                    </li>
                                </ul>
                                <p className="text-sm font-bold text-foreground pt-4">
                                    Êtes-vous sûr de vouloir valider ce dossier ?
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={submitting}>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleValidate}
                            className="bg-green-600 hover:bg-green-700"
                            disabled={submitting}
                        >
                            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                            Confirmer la validation
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showSubmitModal} onOpenChange={setShowSubmitModal}>
                <AlertDialogContent className="sm:max-w-[500px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            {creditRequest.is_complete ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                                <AlertCircle className="h-5 w-5 text-orange-500" />
                            )}
                            {creditRequest.is_complete ? "Confirmer la soumission" : "Dossier incomplet"}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-4 pt-2" asChild>
                            <div>
                                {creditRequest.is_complete ? (
                                    <p className="text-sm">
                                        Votre dossier est complet. Veuillez vérifier une dernière fois l'ensemble des informations saisies (montant, étudiant, garant, documents) avant la soumission finale.
                                    </p>
                                ) : (
                                    <>
                                        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-orange-800">
                                            <div className="flex items-center gap-2 mb-2">
                                                <AlertCircle className="h-4 w-4 text-orange-600" />
                                                <span className="font-bold text-orange-900">Attention</span>
                                            </div>
                                            <p className="text-xs">
                                                La soumission d'un dossier incomplet présente un risque élevé de <strong>rejet immédiat</strong> par le comité de crédit.
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase">Pièces manquantes :</p>
                                            <ul className="grid grid-cols-1 gap-1">
                                                {creditRequest.missing_documents?.map((doc) => (
                                                    <li key={doc.type} className="flex items-center gap-2 text-xs text-destructive">
                                                        <XCircle className="h-3 w-3" />
                                                        {doc.label}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <p className="text-sm font-medium">
                                            Voulez-vous quand même soumettre ce dossier en l'état ?
                                        </p>
                                    </>
                                )}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={submitting}>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleSubmit}
                            className={creditRequest.is_complete ? "bg-primary" : "bg-orange-600 hover:bg-orange-700"}
                            disabled={submitting}
                        >
                            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                            {creditRequest.is_complete ? "Confirmer l'envoi" : "Soumettre malgré tout"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8">
                {creditRequest.is_complete === false && creditRequest.missing_documents && creditRequest.missing_documents.length > 0 && (
                    <Alert variant="destructive" className="border-red-200 bg-red-50/50 p-4 shadow-none dark:border-red-900/30 dark:bg-red-950/10">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-500" />
                            <div className="flex-1">
                                <AlertTitle className="text-sm font-bold text-red-800 dark:text-red-400">Dossier incomplet</AlertTitle>
                                <AlertDescription className="mt-1 text-red-700 dark:text-red-300/80">
                                    <p className="mb-2 text-xs font-medium">Les documents obligatoires suivants manquent au dossier :</p>
                                    <div className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
                                                {creditRequest.missing_documents && creditRequest.missing_documents.map((doc) => (
                                            <div key={doc.type} className="flex items-center gap-2">
                                                {doc.is_processing ? (
                                                    <>
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-500/70" />
                                                        <span className="text-xs font-medium italic text-muted-foreground">{doc.label} (en cours...)</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <AlertCircle className="h-3.5 w-3.5 text-orange-500/70" />
                                                        <span className="text-xs font-medium">{doc.label}</span>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </AlertDescription>
                            </div>
                        </div>
                    </Alert>
                )}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight">Dossier {creditRequest.code}</h1>
                            <div className="flex items-center gap-2">
                                <Badge variant={status.variant} className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider">
                                    {status.label}
                                </Badge>
                                {creditRequest.is_complete === false && (
                                    <Badge variant="destructive" className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                        Incomplet
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <p className="text-muted-foreground">Gestion et suivi du dossier de crédit</p>
                    </div>

                        <div className="flex items-center gap-3">
                            {(creditRequest.status === 'valider' || creditRequest.status === 'cloturer' || creditRequest.status === 'resilie') && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 gap-2"
                                    onClick={() => router.get(credit.installments.index({ creditRequest: creditRequest.id }).url)}
                                >
                                    <CreditCard className="h-4 w-4" />
                                    <span>Échéancier</span>
                                </Button>
                            )}

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button className="h-9 gap-2">
                                        Actions
                                        <ChevronDown className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>Actions disponibles</DropdownMenuLabel>
                                    <DropdownMenuSeparator />

                                    {creditRequest.status === 'creation' && (
                                        <DropdownMenuItem onClick={() => handleAction('submit')} className="cursor-pointer">
                                            <Upload className="mr-2 h-4 w-4" />
                                            <span>Soumettre le dossier</span>
                                        </DropdownMenuItem>
                                    )}

                                    {creditRequest.status === 'soumis' && (
                                        <>
                                            <DropdownMenuItem onClick={() => handleAction('validate')} className="cursor-pointer text-green-600 focus:text-green-600">
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                <span>Valider le dossier</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleAction('reject')} className="cursor-pointer text-destructive focus:text-destructive">
                                                <XCircle className="mr-2 h-4 w-4" />
                                                <span>Rejeter le dossier</span>
                                            </DropdownMenuItem>
                                        </>
                                    )}

                                    <DropdownMenuItem
                                        onClick={() => window.open(summary({ creditRequest: creditRequest.id }).url, '_blank')}
                                        className="cursor-pointer"
                                    >
                                        <Eye className="mr-2 h-4 w-4" />
                                        <span>Voir le récapitulatif</span>
                                    </DropdownMenuItem>

                                    {creditRequest.status === 'valider' && (
                                        <DropdownMenuItem onClick={() => handleAction('cloturer')} className="cursor-pointer text-gray-600 focus:text-gray-600">
                                            <Minus className="mr-2 h-4 w-4" />
                                            <span>Clôturer le dossier</span>
                                        </DropdownMenuItem>
                                    )}

                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => router.get(terminationRequests.create({ query: { creditRequest: creditRequest.id } }).url)}
                                        className="cursor-pointer text-destructive focus:text-destructive"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        <span>Demander la résiliation</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-12">
                    {/* Div 1 (gauche): Historique des actions */}
                    <div className="lg:col-span-3">
                        <Frame className="h-full">
                            <FrameHeader>
                                <FrameTitle className="flex items-center gap-2">
                                    <Info className="h-5 w-5 text-primary" />
                                    Historique
                                </FrameTitle>
                                <FrameDescription>Suivi des actions effectuées sur ce dossier</FrameDescription>
                            </FrameHeader>
                            <FramePanel>
                                <div className="space-y-6">
                                    <div className="relative space-y-6 before:absolute before:bottom-0 before:left-[11px] before:top-2 before:w-0.5 before:bg-muted">
                                        {/* Activités dynamiques */}
                                        {creditRequest.activities && creditRequest.activities.data.length > 0 ? (
                                            <>
                                                {creditRequest.activities.data.map((activity) => (
                                                    <div key={activity.id} className="relative pl-8">
                                                        <div className={`absolute left-0 top-1 h-6 w-6 rounded-full border-4 border-background ${getActivityColor(activity.action)} flex items-center justify-center transition-transform hover:scale-110`}>
                                                            {getActivityIcon(activity.action)}
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                                                                {activity.action === 'creation' ? 'Création' :
                                                                activity.action === 'submission' || activity.action === 'soumettre' ? 'Soumission' :
                                                                activity.action === 'validation' || activity.action === 'valider' ? 'Validation' :
                                                                activity.action === 'rejection' || activity.action === 'rejeter' ? 'Rejet' :
                                                                activity.action === 'resiliation' || activity.action === 'resilier' ? 'Résiliation' :
                                                                activity.action === 'document_upload' || activity.action === 'document_added' ? 'Document ajouté' :
                                                                activity.action === 'document_delete' || activity.action === 'document_deleted' ? 'Document supprimé' :
                                                                activity.action}
                                                            </p>
                                                            <p className="text-sm font-medium leading-tight text-foreground/90">{activity.description}</p>
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-[11px] font-semibold text-primary/80">{activity.user?.name || 'Système'}</p>
                                                                <span className="text-[10px] text-muted-foreground">•</span>
                                                                <p className="text-[11px] text-muted-foreground font-medium">{formatDate(activity.created_at)}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                {creditRequest.activities.links.next && (
                                                    <div className="relative pl-8">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-full justify-start px-0 text-xs font-semibold text-muted-foreground hover:bg-transparent hover:text-primary"
                                                            onClick={loadMoreActivities}
                                                            disabled={isLoadingMore}
                                                        >
                                                            {isLoadingMore ? (
                                                                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                                            ) : (
                                                                <ChevronRight className="mr-2 h-3 w-3" />
                                                            )}
                                                            {isLoadingMore ? 'Chargement...' : 'Charger plus'}
                                                        </Button>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="relative pl-8">
                                                <div className="absolute left-0 top-1 h-6 w-6 rounded-full border-4 border-background bg-blue-500 flex items-center justify-center">
                                                    <UserCheck className="h-3 w-3 text-white" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-bold uppercase text-blue-600">Création</p>
                                                    <p className="text-sm font-medium leading-none">{creditRequest.creator?.name}</p>
                                                    <p className="text-[11px] text-muted-foreground">{formatDate(creditRequest.created_at)}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </FramePanel>
                        </Frame>
                    </div>

                    {/* Div 2 (milieu): Informations sur le dossier */}
                    <div className="lg:col-span-5">
                        <Frame className="h-full">
                            <FrameHeader>
                                <FrameTitle className="flex items-center gap-2">
                                    <Briefcase className="h-5 w-5 text-primary" />
                                    Informations Générales
                                </FrameTitle>
                                <FrameDescription>Détails du prêt, de l'étudiant et du garant</FrameDescription>
                            </FrameHeader>
                            <FramePanel>
                                <div className="space-y-8">
                                    {/* Informations sur le Prêt */}
                                    <div className="space-y-4">
                                        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                            <Briefcase className="h-4 w-4" /> Détails du Prêt
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <span className="text-[11px] font-medium text-muted-foreground uppercase">Type de crédit</span>
                                                <p className="text-sm font-bold text-primary">{creditRequest.credit_type?.name}</p>
                                                {creditRequest.credit_type?.description && (
                                                    <p className="text-[10px] text-muted-foreground leading-tight">{creditRequest.credit_type.description}</p>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[11px] font-medium text-muted-foreground uppercase">Pays de destination</span>
                                                <p className="flex items-center gap-1.5 text-sm font-semibold">
                                                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                                                    {creditRequest.country?.name}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <span className="text-[11px] font-medium text-muted-foreground uppercase">Montant sollicité</span>
                                                <p className="text-xl font-bold text-primary">{formatCurrency(creditRequest.amount_requested)}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[11px] font-medium text-muted-foreground uppercase">Apport initial</span>
                                                <p className="text-lg font-bold text-muted-foreground">{formatCurrency(creditRequest.initial_contribution)}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <span className="text-[11px] font-medium text-muted-foreground uppercase flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" /> Date création
                                                </span>
                                                <p className="text-sm font-medium">{creditRequest.created_at ? new Date(creditRequest.created_at).toLocaleDateString('fr-FR') : '—'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[11px] font-medium text-muted-foreground uppercase">Durée type</span>
                                                <p className="text-sm font-medium">{creditRequest.credit_type?.duration_months} mois</p>
                                            </div>
                                        </div>

                                        <div className="mt-4 p-3 bg-muted/50 rounded-lg space-y-3 border border-border/50">
                                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Frais de microfinance</h4>

                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-muted-foreground">Assurance (1%)</span>
                                                <span className="font-semibold">{formatCurrency(creditRequest.insurance_amount || 0)}</span>
                                            </div>

                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-muted-foreground">Frais de dossier (variable)</span>
                                                <span className="font-semibold">{formatCurrency(creditRequest.processing_fees_variable || 0)}</span>
                                            </div>

                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-muted-foreground">Frais de dossier (fixe)</span>
                                                <span className="font-semibold">{formatCurrency(creditRequest.processing_fees_fixed || 0)}</span>
                                            </div>

                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-muted-foreground">Intérêt 1er mois</span>
                                                <span className="font-semibold">{formatCurrency(creditRequest.first_month_interest || 0)}</span>
                                            </div>

                                            <Separator className="my-1 bg-border" />

                                            <div className="flex justify-between items-center text-sm">
                                                <span className="font-bold text-primary">TOTAL FRAIS</span>
                                                <span className="font-black text-primary">{formatCurrency(creditRequest.total_microfinance_fees || 0)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Informations Étudiant */}
                                    <div className="space-y-4">
                                        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                            <User className="h-4 w-4" /> Informations Étudiant
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <span className="text-[11px] font-medium text-muted-foreground uppercase">Nom complet</span>
                                                <p className="text-sm font-bold">{creditRequest.student?.first_name} {creditRequest.student?.last_name}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <span className="text-[11px] font-medium text-muted-foreground uppercase">Téléphone / WhatsApp</span>
                                                <p className="text-sm font-medium">{creditRequest.student?.whatsapp_number || '—'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[11px] font-medium text-muted-foreground uppercase">Email</span>
                                                <p className="text-sm font-medium truncate">{creditRequest.student?.email || '—'}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <span className="text-[11px] font-medium text-muted-foreground uppercase">Type Pièce</span>
                                                <p className="text-sm font-medium">{creditRequest.student?.id_card_type || '—'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[11px] font-medium text-muted-foreground uppercase">Numéro Pièce</span>
                                                <p className="text-sm font-medium">{creditRequest.student?.id_card_number || '—'}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <span className="text-[11px] font-medium text-muted-foreground uppercase">Adresse</span>
                                                <p className="text-sm font-medium">{creditRequest.student?.address || '—'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[11px] font-medium text-muted-foreground uppercase">Autre contact</span>
                                                <p className="text-sm font-medium">{creditRequest.student?.other_number || '—'}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <span className="text-[11px] font-medium text-muted-foreground uppercase">Compte Amplitude</span>
                                                <p className="text-sm font-mono font-bold text-primary">{creditRequest.student?.amplitude_account || creditRequest.student?.amplitude_account_number || '—'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Informations Garant */}
                                    {creditRequest.guarantor ? (
                                        <div className="space-y-4">
                                            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                                <ShieldCheck className="h-4 w-4" /> Informations Garant
                                            </h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <span className="text-[11px] font-medium text-muted-foreground uppercase">Nom complet</span>
                                                    <p className="text-sm font-bold">{creditRequest.guarantor.first_name} {creditRequest.guarantor.last_name}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[11px] font-medium text-muted-foreground uppercase">Profession</span>
                                                    <p className="text-sm font-medium truncate">{creditRequest.guarantor.profession || '—'}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <span className="text-[11px] font-medium text-muted-foreground uppercase">Téléphone</span>
                                                    <p className="text-sm font-medium">{creditRequest.guarantor.whatsapp_number || creditRequest.guarantor.other_number || '—'}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[11px] font-medium text-muted-foreground uppercase">Email</span>
                                                    <p className="text-sm font-medium">{creditRequest.guarantor.email || '—'}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <span className="text-[11px] font-medium text-muted-foreground uppercase">Type Pièce</span>
                                                    <p className="text-sm font-medium">{creditRequest.guarantor.id_card_type || '—'}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[11px] font-medium text-muted-foreground uppercase">Numéro Pièce</span>
                                                    <p className="text-sm font-medium">{creditRequest.guarantor.id_card_number || '—'}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <span className="text-[11px] font-medium text-muted-foreground uppercase">Adresse</span>
                                                    <p className="text-sm font-medium">{creditRequest.guarantor.address || '—'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="rounded-lg bg-muted/50 p-4 text-center">
                                            <p className="text-sm text-muted-foreground">Aucun garant renseigné pour ce dossier.</p>
                                        </div>
                                    )}
                                </div>
                            </FramePanel>
                        </Frame>
                    </div>

                    {/* Div 3 (droite): Documents */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Upload */}
                        <Frame>
                            <FrameHeader>
                                <FrameTitle className="flex items-center gap-2">
                                    <Upload className="h-5 w-5 text-primary" />
                                    Ajouter des Documents
                                </FrameTitle>
                                <FrameDescription>Téléverser de nouvelles pièces jointes</FrameDescription>
                            </FrameHeader>
                            <FramePanel>
                                <CreditDocumentUpload creditRequestId={creditRequest.id} />
                            </FramePanel>
                        </Frame>

                        {/* List */}
                        <Frame className="min-h-[300px]">
                            <FrameHeader>
                                <FrameTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-primary" />
                                    Documents joints
                                </FrameTitle>
                                <FrameDescription>Consulter les documents déjà présents</FrameDescription>
                            </FrameHeader>
                            <FramePanel>
                                {creditRequest.media && creditRequest.media.length > 0 ? (
                                    <div className="space-y-3">
                                        {creditRequest.media.map((doc: Media) => (
                                            <div key={doc.id} className="group flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                                                        <FileText className="h-4 w-4" />
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <p className="truncate text-xs font-bold leading-tight" title={doc.name}>
                                                            {doc.name}
                                                        </p>
                                                        {doc.custom_properties?.type && (
                                                            <p className="text-[10px] font-medium text-primary">
                                                                {documentTypes.find(t => t.value === doc.custom_properties?.type)?.label || doc.custom_properties?.type}
                                                            </p>
                                                        )}
                                                        <p className="text-[10px] text-muted-foreground">
                                                            {formatFileSize(doc.size)} • {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                                        <a href={doc.original_url} target="_blank" rel="noreferrer">
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </a>
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteDocument(doc.id)}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="rounded-full bg-muted p-3">
                                            <FileText className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <p className="mt-2 text-xs font-medium text-muted-foreground">Aucun document pour le moment</p>
                                    </div>
                                )}
                            </FramePanel>
                        </Frame>
                    </div>
                </div>
            </div>
            <AlertDialog open={showCloturerModal} onOpenChange={setShowCloturerModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmer la clôture</AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir clôturer ce dossier ? Cette action est irréversible et marquera le dossier comme terminé.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCloturer}
                            disabled={submitting}
                            className="bg-gray-600 hover:bg-gray-700"
                        >
                            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Confirmer la clôture
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

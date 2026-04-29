import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle,
    ChevronDown,
    CreditCard,
    Eye,
    FileText,
    Trash2,
    Upload,
    XCircle,
} from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

import { regenerateDocument, validateRequest } from '@/actions/App/Http/Controllers/Credit/CreditRequestController';
import ActionModals from '@/components/credit/show/ActionModals';
import CreditActivityHistory from '@/components/credit/show/CreditActivityHistory';
import CreditDocuments from '@/components/credit/show/CreditDocuments';
import CreditGeneralInfo from '@/components/credit/show/CreditGeneralInfo';
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from '@/components/ui/alert';
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

import credit, { cloturer as cloturerRoute, reject, resiliate, submit, summary } from '@/routes/credit';
import { deleteMethod } from '@/routes/credit/documents';
import terminationRequests from '@/routes/credit/termination-requests/index';
import type { BreadcrumbItem, CreditRequest, ModelUser } from '@/types';

interface ShowProps {
    creditRequest: CreditRequest;
    breadcrumbs: BreadcrumbItem[];
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'blue' | 'orange' | 'green' | 'purple' | 'gray' }> = {
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
    }, [page.props]);

    const { post, delete: destroy, processing: submitting } = useForm();
    const rejectForm = useForm({ reason: '' });

    const [showSubmitModal, setShowSubmitModal] = React.useState(false);
    const [showValidateModal, setShowValidateModal] = React.useState(false);
    const [showRejectModal, setShowRejectModal] = React.useState(false);
    const [showCloturerModal, setShowCloturerModal] = React.useState(false);
    const [mediaToDelete, setMediaToDelete] = React.useState<number | null>(null);

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
        post(cloturerRoute({ creditRequest: creditRequest.id }).url, {
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
            minute: '2-digit',
        });
    };

    const handleRegenerateDocument = () => {
        post(regenerateDocument({ creditRequest: creditRequest.id }).url, {
            onSuccess: () => {
                toast.success('Le contrat est en cours de régénération.');
            },
        });
    };

    const handleAction = (action: 'submit' | 'validate' | 'resiliate' | 'reject' | 'cloturer' | 'regenerate') => {
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

        if (action === 'regenerate') {
            handleRegenerateDocument();

            return;
        }

        const routeMap = {
            validateRequest,
            resiliate,
        };

        const actionRoute = (routeMap as any)[action];

        post(actionRoute({ creditRequest: creditRequest.id }).url, {
            preserveScroll: true,
            preserveState: true,
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
            },
        );
    };

    return (
        <>
            <Head title={`Détails dossier ${creditRequest.code}`} />

            <ActionModals
                creditRequest={creditRequest}
                isAdmin={isAdmin || false}
                mediaToDelete={mediaToDelete}
                setMediaToDelete={setMediaToDelete}
                confirmDelete={confirmDelete}
                submitting={submitting}
                showRejectModal={showRejectModal}
                setShowRejectModal={setShowRejectModal}
                rejectForm={rejectForm}
                handleReject={handleReject}
                showValidateModal={showValidateModal}
                setShowValidateModal={setShowValidateModal}
                handleValidate={handleValidate}
                showSubmitModal={showSubmitModal}
                setShowSubmitModal={setShowSubmitModal}
                handleSubmit={handleSubmit}
                showCloturerModal={showCloturerModal}
                setShowCloturerModal={setShowCloturerModal}
                handleCloturer={handleCloturer}
            />

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
                                        {creditRequest.missing_documents.map((doc) => (
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
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 gap-2"
                                    onClick={() => router.get(credit.installments.index({ creditRequest: creditRequest.id }).url)}
                                >
                                    <CreditCard className="h-4 w-4" />
                                    <span>Échéancier</span>
                                </Button>

                                {(creditRequest.status === 'valider' && (creditRequest as any).can_regenerate_contract) && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 gap-2"
                                        onClick={handleRegenerateDocument}
                                        disabled={submitting}
                                    >
                                        <FileText className="h-4 w-4" />
                                        <span>Régénérer le contrat</span>
                                    </Button>
                                )}
                            </div>
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
                                        <XCircle className="mr-2 h-4 w-4" />
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
                    <div className="lg:col-span-3">
                        <CreditActivityHistory
                            creditRequest={creditRequest}
                            isLoadingMore={isLoadingMore}
                            loadMoreActivities={loadMoreActivities}
                            formatDate={formatDate}
                        />
                    </div>

                    <div className="lg:col-span-5">
                        <CreditGeneralInfo
                            creditRequest={creditRequest}
                            formatCurrency={formatCurrency}
                        />
                    </div>

                    <CreditDocuments
                        creditRequest={creditRequest}
                        documentTypes={documentTypes}
                        formatFileSize={formatFileSize}
                        handleDeleteDocument={handleDeleteDocument}
                    />
                </div>
            </div>
        </>
    );
}

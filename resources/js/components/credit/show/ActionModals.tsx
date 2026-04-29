import React from 'react';
import {
    AlertCircle,
    CheckCircle,
    Loader2,
    ShieldCheck,
    Trash2,
    XCircle,
} from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CreditRequest } from '@/types';

interface ActionModalsProps {
    creditRequest: CreditRequest;
    isAdmin: boolean;
    mediaToDelete: number | null;
    setMediaToDelete: (id: number | null) => void;
    confirmDelete: () => void;
    submitting: boolean;
    showRejectModal: boolean;
    setShowRejectModal: (show: boolean) => void;
    rejectForm: any;
    handleReject: () => void;
    showValidateModal: boolean;
    setShowValidateModal: (show: boolean) => void;
    handleValidate: () => void;
    showSubmitModal: boolean;
    setShowSubmitModal: (show: boolean) => void;
    handleSubmit: () => void;
    showCloturerModal: boolean;
    setShowCloturerModal: (show: boolean) => void;
    handleCloturer: () => void;
}

export default function ActionModals({
    creditRequest,
    isAdmin,
    mediaToDelete,
    setMediaToDelete,
    confirmDelete,
    submitting,
    showRejectModal,
    setShowRejectModal,
    rejectForm,
    handleReject,
    showValidateModal,
    setShowValidateModal,
    handleValidate,
    showSubmitModal,
    setShowSubmitModal,
    handleSubmit,
    showCloturerModal,
    setShowCloturerModal,
    handleCloturer,
}: ActionModalsProps) {
    return (
        <>
            {/* Modal Suppression Document */}
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

            {/* Modal Rejet */}
            <AlertDialog open={showRejectModal} onOpenChange={setShowRejectModal}>
                <AlertDialogContent className="sm:max-w-[500px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-destructive" />
                            Rejet du dossier
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-4 pt-2" asChild>
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
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={rejectForm.processing || !rejectForm.data.reason}
                        >
                            {rejectForm.processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                            Confirmer le rejet
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Modal Validation */}
            <AlertDialog open={showValidateModal} onOpenChange={setShowValidateModal}>
                <AlertDialogContent className="sm:max-w-[600px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-green-600" />
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

            {/* Modal Soumission */}
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

            {/* Modal Clôture */}
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

"use client";

import { useForm, router } from "@inertiajs/react";
import {
    AlertCircleIcon,
    FileArchiveIcon,
    FileIcon,
    FileSpreadsheetIcon,
    FileTextIcon,
    FileUpIcon,
    HeadphonesIcon,
    ImageIcon,
    VideoIcon,
    XIcon,
    CheckCircle2,
    Loader2,
} from "lucide-react";
import React, { useState, useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { formatBytes, useFileUpload } from "@/hooks/use-file-upload";
import { upload } from "@/routes/credit/documents";

interface CreditDocumentUploadProps {
    creditRequestId: number;
}

const documentTypes = [
    { value: 'demande_pret', label: 'Demande de prêt' },
    { value: 'engagement_rembourser', label: 'Engagement à rembourser' },
    { value: 'ouverture_compte', label: 'Ouverture de compte' },
    { value: 'recu_micro_finance', label: 'Reçu de la micro-finance' },
    { value: 'recu_apport_initial', label: "Reçu de l'apport initial" },
    { value: 'passport_etudiant', label: "Passeport de l'étudiant" },
    { value: 'cni_passport_garant', label: 'CNI ou passeport du garant' },
    { value: 'certificat_residence', label: 'Certificat de résidence' },
    { value: 'other', label: 'Autre' },
];

const getFileIcon = (file: { file: File | { type: string; name: string } }) => {
    const fileType = file.file instanceof File ? file.file.type : file.file.type;
    const fileName = file.file instanceof File ? file.file.name : file.file.name;

    if (
        fileType.includes("pdf") ||
        fileName.endsWith(".pdf") ||
        fileType.includes("word") ||
        fileName.endsWith(".doc") ||
        fileName.endsWith(".docx")
    ) {
        return <FileTextIcon className="size-4 opacity-60" />;
    }

    if (
        fileType.includes("zip") ||
        fileType.includes("archive") ||
        fileName.endsWith(".zip") ||
        fileName.endsWith(".rar")
    ) {
        return <FileArchiveIcon className="size-4 opacity-60" />;
    }

    if (
        fileType.includes("excel") ||
        fileName.endsWith(".xls") ||
        fileName.endsWith(".xlsx")
    ) {
        return <FileSpreadsheetIcon className="size-4 opacity-60" />;
    }

    if (fileType.includes("video/")) {
        return <VideoIcon className="size-4 opacity-60" />;
    }

    if (fileType.includes("audio/")) {
        return <HeadphonesIcon className="size-4 opacity-60" />;
    }

    if (fileType.startsWith("image/")) {
        return <ImageIcon className="size-4 opacity-60" />;
    }

    return <FileIcon className="size-4 opacity-60" />;
};

export default function CreditDocumentUpload({ creditRequestId }: CreditDocumentUploadProps) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const maxFiles = 10;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [fileTypes, setFileTypes] = useState<Record<string, string>>({});
    const [isVerifying, setIsVerifying] = useState(false);

    const [
        { files, isDragging, errors },
        {
            handleDragEnter,
            handleDragLeave,
            handleDragOver,
            handleDrop,
            openFileDialog,
            removeFile,
            clearFiles,
            getInputProps,
        },
    ] = useFileUpload({
        maxFiles,
        maxSize,
        multiple: true,
    });

    const { processing, reset } = useForm<{
        documents: File[];
        types: string[];
    }>({
        documents: [],
        types: [],
    });

    const canSubmit = useMemo(() => {
        return files.length > 0 && files.every(f => fileTypes[f.id]);
    }, [files, fileTypes]);

    const handleOpenModal = () => {
        if (files.length > 0) {
            setIsModalOpen(true);
        }
    };

    const handleTypeChange = (fileId: string, type: string) => {
        setFileTypes(prev => ({ ...prev, [fileId]: type }));
    };

    const handleSubmit = () => {
        const documents = files.map(f => f.file as File);
        const types = files.map(f => fileTypes[f.id]);

        setIsVerifying(true);
        setVerificationStep('uploading');

        router.post(upload(creditRequestId).url, {
            documents,
            types,
        }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setIsModalOpen(false);
                setIsVerifying(false);
                clearFiles();
                setFileTypes({});
                reset();
            },
            onError: () => {
                setIsVerifying(false);
            }
        });
    };

    return (
        <div className="flex flex-col gap-3">
            {/* Drop area */}
            <div
                className="flex min-h-32 flex-col items-center justify-center rounded-xl border border-input border-dashed p-4 transition-colors hover:bg-accent/50 has-disabled:pointer-events-none has-[input:focus]:border-ring has-disabled:opacity-50 has-[input:focus]:ring-[3px] has-[input:focus]:ring-ring/50 data-[dragging=true]:bg-accent/50 cursor-pointer"
                data-dragging={isDragging || undefined}
                onClick={openFileDialog}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                role="button"
                tabIndex={-1}
            >
                <input
                    {...getInputProps()}
                    aria-label="Upload files"
                    className="sr-only"
                />

                <div className="flex flex-col items-center justify-center text-center">
                    <div
                        aria-hidden="true"
                        className="mb-2 flex size-9 shrink-0 items-center justify-center rounded-full border bg-background"
                    >
                        <FileUpIcon className="size-4 opacity-60" />
                    </div>
                    <p className="mb-1 font-medium text-sm">Charger des documents</p>
                    <p className="text-muted-foreground text-xs">
                        Glissez-déposez ou cliquez pour parcourir
                    </p>
                </div>
            </div>

            {errors.length > 0 && (
                <div
                    className="flex items-center gap-1 text-destructive text-xs"
                    role="alert"
                >
                    <AlertCircleIcon className="size-3 shrink-0" />
                    <span>{errors[0]}</span>
                </div>
            )}

            {/* File list */}
            {files.length > 0 && (
                <div className="space-y-2">
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                        {files.map((file) => (
                            <div
                                className="flex items-center justify-between gap-2 rounded-lg border bg-background p-2 pe-3"
                                key={file.id}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded border">
                                        {getFileIcon(file)}
                                    </div>
                                    <div className="flex min-w-0 flex-col">
                                        <p className="truncate font-medium text-xs">
                                            {file.file instanceof File ? file.file.name : ""}
                                        </p>
                                        <p className="text-muted-foreground text-[10px]">
                                            {formatBytes(file.file instanceof File ? file.file.size : 0)}
                                        </p>
                                    </div>
                                </div>

                                <Button
                                    aria-label="Remove file"
                                    className="-me-2 size-7 text-muted-foreground/80 hover:bg-transparent hover:text-foreground"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeFile(file.id);
                                    }}
                                    size="icon"
                                    variant="ghost"
                                >
                                    <XIcon aria-hidden="true" className="size-3.5" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2 pt-1">
                        <Button
                            onClick={handleOpenModal}
                            className="flex-1 h-8 text-xs"
                            variant="default"
                        >
                            Configurer et envoyer ({files.length})
                        </Button>
                        <Button
                            onClick={clearFiles}
                            variant="outline"
                            className="h-8 text-xs"
                        >
                            Tout effacer
                        </Button>
                    </div>
                </div>
            )}

            {/* Modal for setting document types */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-md">
                    {isVerifying ? (
                        <div className="flex flex-col items-center justify-center py-10 space-y-4">
                            {verificationStep === 'uploading' && (
                                <>
                                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                    <div className="text-center">
                                        <p className="font-bold">Upload en cours...</p>
                                        <p className="text-xs text-muted-foreground">Transfert de vos fichiers vers les serveurs</p>
                                    </div>
                                </>
                            )}
                            {verificationStep === 'verifying' && (
                                <>
                                    <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
                                    <div className="text-center">
                                        <p className="font-bold">Vérification S3...</p>
                                        <p className="text-xs text-muted-foreground">Confirmation de la présence des fichiers sur le stockage sécurisé</p>
                                    </div>
                                </>
                            )}
                            {verificationStep === 'success' && (
                                <>
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-green-600">Upload réussi !</p>
                                        <p className="text-xs text-muted-foreground">Vos documents ont été enregistrés avec succès</p>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <>
                            <DialogHeader>
                                <DialogTitle>Type de documents</DialogTitle>
                                <DialogDescription>
                                    Attribuez un type à chaque document avant de les envoyer.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="max-h-[60vh] overflow-y-auto py-4 space-y-4">
                                {files.map((file) => (
                                    <div key={file.id} className="space-y-2">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <div className="flex aspect-square size-6 shrink-0 items-center justify-center rounded border bg-muted">
                                                {getFileIcon(file)}
                                            </div>
                                            <p className="truncate text-xs font-medium">
                                                {file.file instanceof File ? file.file.name : ""}
                                            </p>
                                        </div>
                                        <Select
                                            value={fileTypes[file.id]}
                                            onValueChange={(val) => handleTypeChange(file.id, val)}
                                        >
                                            <SelectTrigger className="w-full h-8 text-xs">
                                                <SelectValue placeholder="Sélectionner un type..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {documentTypes.map((type) => (
                                                    <SelectItem key={type.value} value={type.value} className="text-xs">
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ))}
                            </div>

                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsModalOpen(false)}
                                    className="h-8 text-xs"
                                    disabled={processing}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={!canSubmit || processing}
                                    className="h-8 text-xs gap-1.5"
                                >
                                    {processing ? "Envoi en cours..." : (
                                        <>
                                            <CheckCircle2 className="size-3.5" />
                                            Confirmer l'envoi
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

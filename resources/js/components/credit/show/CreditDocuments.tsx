import {
    Eye,
    FileText,
    Trash2,
    Upload,
} from 'lucide-react';
import React from 'react';

import CreditDocumentUpload from '@/components/credit/credit-document-upload';
import { Button } from '@/components/ui/button';
import {
    Frame,
    FrameDescription,
    FrameHeader,
    FramePanel,
    FrameTitle,
} from '@/components/ui/frame';
import type { CreditRequest, Media } from '@/types';

interface CreditDocumentsProps {
    creditRequest: CreditRequest;
    documentTypes: { value: string; label: string }[];
    formatFileSize: (bytes: number) => string;
    handleDeleteDocument: (mediaId: number) => void;
}

export default function CreditDocuments({
    creditRequest,
    documentTypes,
    formatFileSize,
    handleDeleteDocument,
}: CreditDocumentsProps) {
    return (
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
                    <CreditDocumentUpload creditRequestId={creditRequest.id} documentTypes={documentTypes} />
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
                                                    {documentTypes.find((t) => t.value === doc.custom_properties?.type)?.label || doc.custom_properties?.type}
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
    );
}

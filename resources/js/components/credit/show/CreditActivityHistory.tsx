import {
    CheckCircle,
    ChevronRight,
    Info,
    Loader2,
    Minus,
    Plus,
    Trash2,
    Upload,
    UserCheck,
    XCircle,
} from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import {
    Frame,
    FrameDescription,
    FrameHeader,
    FramePanel,
    FrameTitle,
} from '@/components/ui/frame';
import type { CreditRequest } from '@/types';

interface CreditActivityHistoryProps {
    creditRequest: CreditRequest;
    isLoadingMore: boolean;
    loadMoreActivities: (e: React.MouseEvent) => void;
    formatDate: (date: string | null | undefined) => string;
}

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

const getActivityLabel = (action: string) => {
    switch (action) {
        case 'creation':
            return 'Création';
        case 'submission':
        case 'soumettre':
            return 'Soumission';
        case 'validation':
        case 'valider':
            return 'Validation';
        case 'rejection':
        case 'rejeter':
            return 'Rejet';
        case 'resiliation':
        case 'resilier':
            return 'Résiliation';
        case 'document_upload':
        case 'document_added':
            return 'Document ajouté';
        case 'document_delete':
        case 'document_deleted':
            return 'Document supprimé';
        default:
            return action;
    }
};

export default function CreditActivityHistory({
    creditRequest,
    isLoadingMore,
    loadMoreActivities,
    formatDate,
}: CreditActivityHistoryProps) {
    return (
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
                        {creditRequest.activities && creditRequest.activities.data.length > 0 ? (
                            <>
                                {creditRequest.activities.data.map((activity) => (
                                    <div key={activity.id} className="relative pl-8">
                                        <div className={`absolute left-0 top-1 h-6 w-6 rounded-full border-4 border-background ${getActivityColor(activity.action)} flex items-center justify-center transition-transform hover:scale-110`}>
                                            {getActivityIcon(activity.action)}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                                                {getActivityLabel(activity.action)}
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
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <ChevronRight className="mr-2 h-4 w-4" />
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
    );
}

import {
    Briefcase,
    Calendar,
    Globe,
    ShieldCheck,
    User,
} from 'lucide-react';
import React from 'react';

import {
    Frame,
    FrameDescription,
    FrameHeader,
    FramePanel,
    FrameTitle,
} from '@/components/ui/frame';
import { Separator } from '@/components/ui/separator';
import type { CreditRequest } from '@/types';

interface CreditGeneralInfoProps {
    creditRequest: CreditRequest;
    formatCurrency: (amount: string | number) => string;
}

export default function CreditGeneralInfo({
    creditRequest,
    formatCurrency,
}: CreditGeneralInfoProps) {
    return (
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
    );
}

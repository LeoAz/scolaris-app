import { Head, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar as CalendarIcon, Loader2, Send } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import CreditLayout from '@/layouts/credit/credit-layout';
import { cn } from '@/lib/utils';
import terminationRequests from '@/routes/credit/termination-requests/index';
import type { BreadcrumbItem } from '@/types';

interface CreditRequest {
    id: number;
    code: string;
    student?: {
        first_name: string;
        last_name: string;
    };
}

interface CreateProps {
    creditRequest: CreditRequest;
    breadcrumbs: BreadcrumbItem[];
}

export default function Create({ creditRequest, breadcrumbs }: CreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        requested_date: new Date().toISOString().split('T')[0],
        reason: '',
        description: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(terminationRequests.store(creditRequest.id).url);
    };

    return (
        <CreditLayout breadcrumbs={breadcrumbs} hideSidebar>
            <Head title="Demande de résiliation" />

            <div className="mx-auto max-w-2xl space-y-6 py-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Demande de résiliation</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Soumettez une demande de résiliation pour le dossier de prêt {creditRequest.code}.
                    </p>
                </div>

                <Card className="border-border/40 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Détails de la demande</CardTitle>
                        <CardDescription>
                            Prêt pour {creditRequest.student?.first_name} {creditRequest.student?.last_name}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid gap-2">
                                <Label htmlFor="requested_date">Date de résiliation souhaitée</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                'w-full justify-start text-left font-normal',
                                                !data.requested_date && 'text-muted-foreground',
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {data.requested_date ? (
                                                format(new Date(data.requested_date), 'PPP', { locale: fr })
                                            ) : (
                                                <span>Sélectionnez une date</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={data.requested_date ? new Date(data.requested_date) : undefined}
                                            onSelect={(date) => setData('requested_date', date ? format(date, 'yyyy-MM-dd') : '')}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                {errors.requested_date && <p className="text-xs text-destructive">{errors.requested_date}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="reason">Motif de la résiliation</Label>
                                <Input
                                    id="reason"
                                    value={data.reason}
                                    onChange={(e) => setData('reason', e.target.value)}
                                    placeholder="Ex: Remboursement anticipé, Annulation..."
                                    required
                                />
                                {errors.reason && <p className="text-xs text-destructive">{errors.reason}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description">Description détaillée</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Veuillez fournir plus de détails sur les raisons de cette demande..."
                                    rows={5}
                                />
                                {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
                            </div>

                            <div className="flex items-center justify-end gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => window.history.back()}
                                >
                                    Annuler
                                </Button>
                                <Button type="submit" disabled={processing} className="bg-blue-600 hover:bg-blue-700">
                                    {processing ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="mr-2 h-4 w-4" />
                                    )}
                                    Soumettre la demande
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </CreditLayout>
    );
}

import { useForm, useHttp } from '@inertiajs/react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AlertCircle, Calendar as CalendarIcon, Check, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Stepper } from '@/components/ui/stepper';
import { cn } from '@/lib/utils';
import type { Country, CreditRequest, CreditType, Stakeholder } from '@/types';

interface CreditFormProps {
    creditRequest?: CreditRequest;
    countries: Country[];
    creditTypes: CreditType[];
    submitUrl: string;
    method?: 'post' | 'put';
}

export function CreditForm({ creditRequest, countries, creditTypes, submitUrl, method = 'post' }: CreditFormProps) {
    const [step, setStep] = useState(1);
    const [guarantorSearch, setGuarantorSearch] = useState('');
    const [guarantorResults, setGuarantorResults] = useState<Stakeholder[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [openGuarantorSearch, setOpenGuarantorSearch] = useState(false);
    const http = useHttp();

    const handleGuarantorSearch = async () => {
        if (guarantorSearch.length < 2) {
            return;
        }

        setIsSearching(true);

        try {
            const response = await http.get(`/credit/guarantors/search?query=${guarantorSearch}`);
            setGuarantorResults((response as Stakeholder[]) || []);
        } catch (error) {
            console.error('Search error', error);
        } finally {
            setIsSearching(false);
        }
    };

    const { data, setData, post, put, processing, errors } = useForm({
        country_id: creditRequest?.country_id?.toString() || '',
        credit_type_id: creditRequest?.credit_type_id?.toString() || '',
        amount_requested: creditRequest?.amount_requested || '',
        initial_contribution: creditRequest?.initial_contribution || '',
        creation_date: creditRequest?.created_at ? new Date(creditRequest.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        documents: [] as File[],
        student: {
            id: creditRequest?.student?.id || null,
            first_name: creditRequest?.student?.first_name || '',
            last_name: creditRequest?.student?.last_name || '',
            email: creditRequest?.student?.email || '',
            whatsapp_number: creditRequest?.student?.whatsapp_number || '',
            address: creditRequest?.student?.address || '',
            profession: creditRequest?.student?.profession || '',
            amplitude_account: creditRequest?.student?.amplitude_account || '',
            id_card_number: creditRequest?.student?.id_card_number || '',
            id_card_type: creditRequest?.student?.id_card_type || '',
        },
        guarantor: {
            id: creditRequest?.guarantor?.id || null,
            first_name: creditRequest?.guarantor?.first_name || '',
            last_name: creditRequest?.guarantor?.last_name || '',
            email: creditRequest?.guarantor?.email || '',
            whatsapp_number: creditRequest?.guarantor?.whatsapp_number || '',
            address: creditRequest?.guarantor?.address || '',
            profession: creditRequest?.guarantor?.profession || '',
            id_card_number: creditRequest?.guarantor?.id_card_number || '',
            id_card_type: creditRequest?.guarantor?.id_card_type || '',
        },
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            // Only search if the current search string is NOT the name of the selected guarantor
            const selectedName = data.guarantor.id ? `${data.guarantor.first_name} ${data.guarantor.last_name}` : '';

            if (guarantorSearch.length >= 2 && guarantorSearch !== selectedName) {
                handleGuarantorSearch();
            } else if (guarantorSearch.length < 2) {
                setGuarantorResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [guarantorSearch, data.guarantor.id]);

    const nextStep = () => setStep((s) => Math.min(s + 1, 3));
    const prevStep = () => setStep((s) => Math.max(s - 1, 1));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (method === 'post') {
            post(submitUrl, {
                forceFormData: true,
            });
        } else {
            put(submitUrl, {
                forceFormData: true,
            });
        }
    };

    const selectGuarantor = (g: Stakeholder) => {
        setData('guarantor', {
            id: g.id,
            first_name: g.first_name,
            last_name: g.last_name,
            email: g.email || '',
            whatsapp_number: g.whatsapp_number || '',
            address: g.address || '',
            profession: g.profession || '',
            amplitude_account: g.amplitude_account || '',
            id_card_number: g.id_card_number || '',
            id_card_type: g.id_card_type || '',
        });
        setGuarantorSearch(`${g.first_name} ${g.last_name}`);
        setGuarantorResults([]);
        setOpenGuarantorSearch(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-12">
            {Object.keys(errors).length > 0 && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erreur de validation</AlertTitle>
                    <AlertDescription>
                        Veuillez corriger les erreurs suivantes avant de continuer :
                        <ul className="mt-2 list-inside list-disc">
                            {Object.entries(errors).map(([key, message]) => (
                                <li key={key}>{message.toString()}</li>
                            ))}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}
            <div className="px-4 py-2">
                <Stepper
                    current={step}
                    steps={[
                        { label: 'Dossier' },
                        { label: 'Garant' },
                        { label: 'Revue' },
                    ]}
                />
            </div>

            {step === 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Étape 1 : Dossier et Étudiant</CardTitle>
                        <CardDescription>Informations générales sur le prêt et l'étudiant.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="country_id">Pays</Label>
                                <Select value={data.country_id} onValueChange={(v) => setData('country_id', v)}>
                                    <SelectTrigger id="country_id" className="w-full">
                                        <SelectValue placeholder="Sélectionnez un pays" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {countries.map((c) => (
                                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.country_id && <p className="text-sm text-destructive">{errors.country_id}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="credit_type_id">Type de crédit</Label>
                                <Select value={data.credit_type_id} onValueChange={(v) => setData('credit_type_id', v)}>
                                    <SelectTrigger id="credit_type_id" className="w-full">
                                        <SelectValue placeholder="Sélectionnez un type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {creditTypes.map((t) => (
                                            <SelectItem key={t.id} value={t.id.toString()}>{t.name} ({t.rate}%)</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.credit_type_id && <p className="text-sm text-destructive">{errors.credit_type_id}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="amount_requested">Montant demandé</Label>
                                <Input
                                    id="amount_requested"
                                    type="number"
                                    value={data.amount_requested}
                                    onChange={(e) => setData('amount_requested', e.target.value)}
                                />
                                {errors.amount_requested && <p className="text-sm text-destructive">{errors.amount_requested}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="initial_contribution">Apport initial</Label>
                                <Input
                                    id="initial_contribution"
                                    type="number"
                                    value={data.initial_contribution}
                                    onChange={(e) => setData('initial_contribution', e.target.value)}
                                />
                                {errors.initial_contribution && <p className="text-sm text-destructive">{errors.initial_contribution}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="creation_date">Date de création</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !data.creation_date && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {data.creation_date ? format(new Date(data.creation_date), "PPP", { locale: fr }) : <span>Sélectionnez une date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={data.creation_date ? new Date(data.creation_date) : undefined}
                                            onSelect={(date) => setData('creation_date', date ? date.toISOString().split('T')[0] : '')}
                                            initialFocus
                                            locale={fr}
                                        />
                                    </PopoverContent>
                                </Popover>
                                {errors.creation_date && <p className="text-sm text-destructive">{errors.creation_date}</p>}
                            </div>
                        </div>

                        <Separator className="my-4" />
                        <h3 className="text-lg font-medium">Informations Étudiant</h3>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="student_first_name">Prénom</Label>
                                <Input
                                    id="student_first_name"
                                    value={data.student.first_name}
                                    onChange={(e) => setData('student', { ...data.student, first_name: e.target.value })}
                                />
                                {errors['student.first_name'] && <p className="text-sm text-destructive">{errors['student.first_name']}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="student_last_name">Nom</Label>
                                <Input
                                    id="student_last_name"
                                    value={data.student.last_name}
                                    onChange={(e) => setData('student', { ...data.student, last_name: e.target.value })}
                                />
                                {errors['student.last_name'] && <p className="text-sm text-destructive">{errors['student.last_name']}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="student_email">Email <span className="text-destructive">*</span></Label>
                                <Input
                                    id="student_email"
                                    type="email"
                                    value={data.student.email}
                                    onChange={(e) => setData('student', { ...data.student, email: e.target.value })}
                                />
                                {errors['student.email'] && <p className="text-sm text-destructive">{errors['student.email']}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="student_whatsapp">Numéro WhatsApp <span className="text-destructive">*</span></Label>
                                <Input
                                    id="student_whatsapp"
                                    value={data.student.whatsapp_number}
                                    onChange={(e) => setData('student', { ...data.student, whatsapp_number: e.target.value })}
                                />
                                {errors['student.whatsapp_number'] && <p className="text-sm text-destructive">{errors['student.whatsapp_number']}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="student_address">Adresse</Label>
                                <Input
                                    id="student_address"
                                    value={data.student.address}
                                    onChange={(e) => setData('student', { ...data.student, address: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="student_amplitude">Compte Amplitude</Label>
                                <Input
                                    id="student_amplitude"
                                    value={data.student.amplitude_account}
                                    onChange={(e) => setData('student', { ...data.student, amplitude_account: e.target.value })}
                                    placeholder="Numéro de compte Amplitude"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="student_id_card_type">Type de pièce</Label>
                                <Select value={data.student.id_card_type} onValueChange={(v) => setData('student', { ...data.student, id_card_type: v })}>
                                    <SelectTrigger id="student_id_card_type" className="w-full">
                                        <SelectValue placeholder="Choisir le type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CNI">CNI</SelectItem>
                                        <SelectItem value="PASSPORT">PASSPORT</SelectItem>
                                        <SelectItem value="PERMIS DE CONDUIRE">PERMIS DE CONDUIRE</SelectItem>
                                        <SelectItem value="FICHE INDIVIDUELLE">FICHE INDIVIDUELLE</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="student_id_card_number">Numéro de pièce</Label>
                                <Input
                                    id="student_id_card_number"
                                    value={data.student.id_card_number}
                                    onChange={(e) => setData('student', { ...data.student, id_card_number: e.target.value })}
                                    placeholder="Numéro de la pièce d'identité"
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                        <Button type="button" onClick={nextStep}>Suivant <ChevronRight className="ml-2 h-4 w-4" /></Button>
                    </CardFooter>
                </Card>
            )}

            {step === 2 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Étape 2 : Informations sur le Garant</CardTitle>
                        <CardDescription>Recherchez un garant existant ou créez-en un nouveau.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Rechercher un Garant</Label>
                            <Popover open={openGuarantorSearch} onOpenChange={setOpenGuarantorSearch}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openGuarantorSearch}
                                        className="w-full justify-between"
                                    >
                                        {data.guarantor.id
                                            ? `${data.guarantor.first_name} ${data.guarantor.last_name}`
                                            : "Rechercher par nom, email ou téléphone..."}
                                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                    <Command shouldFilter={false} className="w-full">
                                        <CommandInput
                                            placeholder="Tapez pour rechercher..."
                                            value={guarantorSearch}
                                            onValueChange={setGuarantorSearch}
                                            className="h-9"
                                        />
                                        <CommandList className="max-h-[300px]">
                                            {isSearching && <div className="p-4 text-center text-sm text-muted-foreground animate-pulse">Recherche en cours...</div>}
                                            {!isSearching && guarantorSearch.length >= 2 && guarantorResults.length === 0 && (
                                                <CommandEmpty>Aucun garant trouvé.</CommandEmpty>
                                            )}
                                            <CommandGroup>
                                                {guarantorResults.map((g) => (
                                                    <CommandItem
                                                        key={g.id}
                                                        value={`${g.first_name} ${g.last_name} ${g.id}`}
                                                        onSelect={() => selectGuarantor(g)}
                                                        className="flex flex-col items-start gap-0 py-2"
                                                    >
                                                        <div className="flex w-full items-center justify-between">
                                                            <span className="font-medium">{g.first_name} {g.last_name}</span>
                                                            <Check
                                                                className={cn(
                                                                    "h-4 w-4",
                                                                    data.guarantor.id === g.id ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">{g.email || 'Pas d\'email'} | {g.whatsapp_number}</span>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <Separator className="my-4" />

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="guarantor_first_name">Prénom du Garant</Label>
                                <Input
                                    id="guarantor_first_name"
                                    value={data.guarantor.first_name}
                                    onChange={(e) => setData('guarantor', { ...data.guarantor, first_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="guarantor_last_name">Nom du Garant</Label>
                                <Input
                                    id="guarantor_last_name"
                                    value={data.guarantor.last_name}
                                    onChange={(e) => setData('guarantor', { ...data.guarantor, last_name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="guarantor_email">Email du Garant</Label>
                                <Input
                                    id="guarantor_email"
                                    type="email"
                                    value={data.guarantor.email}
                                    onChange={(e) => setData('guarantor', { ...data.guarantor, email: e.target.value })}
                                />
                                {errors['guarantor.email'] && <p className="text-sm text-destructive">{errors['guarantor.email']}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="guarantor_whatsapp">Numéro WhatsApp <span className="text-destructive">*</span></Label>
                                <Input
                                    id="guarantor_whatsapp"
                                    value={data.guarantor.whatsapp_number}
                                    onChange={(e) => setData('guarantor', { ...data.guarantor, whatsapp_number: e.target.value })}
                                />
                                {errors['guarantor.whatsapp_number'] && <p className="text-sm text-destructive">{errors['guarantor.whatsapp_number']}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="guarantor_address">Adresse</Label>
                                <Input
                                    id="guarantor_address"
                                    value={data.guarantor.address}
                                    onChange={(e) => setData('guarantor', { ...data.guarantor, address: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="guarantor_id_card_type">Type de pièce</Label>
                                <Select value={data.guarantor.id_card_type} onValueChange={(v) => setData('guarantor', { ...data.guarantor, id_card_type: v })}>
                                    <SelectTrigger id="guarantor_id_card_type" className="w-full">
                                        <SelectValue placeholder="Choisir le type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CNI">CNI</SelectItem>
                                        <SelectItem value="PASSPORT">PASSPORT</SelectItem>
                                        <SelectItem value="PERMIS DE CONDUIRE">PERMIS DE CONDUIRE</SelectItem>
                                        <SelectItem value="FICHE INDIVIDUELLE">FICHE INDIVIDUELLE</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="guarantor_id_card_number">Numéro de pièce</Label>
                                <Input
                                    id="guarantor_id_card_number"
                                    value={data.guarantor.id_card_number}
                                    onChange={(e) => setData('guarantor', { ...data.guarantor, id_card_number: e.target.value })}
                                    placeholder="Numéro de la pièce d'identité"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="guarantor_profession">Profession</Label>
                            <Input
                                id="guarantor_profession"
                                value={data.guarantor.profession}
                                onChange={(e) => setData('guarantor', { ...data.guarantor, profession: e.target.value })}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button type="button" variant="ghost" onClick={prevStep}><ChevronLeft className="mr-2 h-4 w-4" /> Précédent</Button>
                        <Button type="button" onClick={nextStep}>Suivant <ChevronRight className="ml-2 h-4 w-4" /></Button>
                    </CardFooter>
                </Card>
            )}

            {step === 3 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Étape 3 : Revue des Informations</CardTitle>
                        <CardDescription>Vérifiez les données avant la création ou la mise à jour.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div className="space-y-3">
                                <h3 className="font-semibold underline">Dossier & Prêt</h3>
                                <div className="space-y-1 text-sm">
                                    <p><span className="text-muted-foreground">Pays :</span> {countries.find(c => c.id.toString() === data.country_id)?.name}</p>
                                    <p><span className="text-muted-foreground">Type :</span> {creditTypes.find(t => t.id.toString() === data.credit_type_id)?.name}</p>
                                    <p><span className="text-muted-foreground">Montant :</span> {data.amount_requested} FCFA</p>
                                    <p><span className="text-muted-foreground">Date :</span> {data.creation_date}</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h3 className="font-semibold underline">Étudiant</h3>
                                <div className="space-y-1 text-sm bg-muted/20 p-3 rounded-lg border">
                                    <p><span className="text-muted-foreground">Nom :</span> {data.student.first_name} {data.student.last_name}</p>
                                    <p><span className="text-muted-foreground">Pièce :</span> {data.student.id_card_type} - {data.student.id_card_number}</p>
                                    <p><span className="text-muted-foreground">Email :</span> {data.student.email}</p>
                                    <p><span className="text-muted-foreground">Compte Amplitude :</span> <span className="font-mono font-medium">{data.student.amplitude_account || 'N/A'}</span></p>
                                    <p><span className="text-muted-foreground">WhatsApp :</span> {data.student.whatsapp_number}</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h3 className="font-semibold underline">Garant</h3>
                                <div className="space-y-1 text-sm bg-muted/20 p-3 rounded-lg border">
                                    <p><span className="text-muted-foreground">Nom :</span> {data.guarantor.first_name} {data.guarantor.last_name}</p>
                                    <p><span className="text-muted-foreground">Pièce :</span> {data.guarantor.id_card_type} - {data.guarantor.id_card_number}</p>
                                    <p><span className="text-muted-foreground">Email :</span> {data.guarantor.email}</p>
                                    <p><span className="text-muted-foreground">Profession :</span> {data.guarantor.profession}</p>
                                </div>
                            </div>
                        </div>

                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Note</AlertTitle>
                            <AlertDescription>
                                Vous pourrez modifier ces informations plus tard tant que le dossier n'est pas soumis.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button type="button" variant="ghost" onClick={prevStep}><ChevronLeft className="mr-2 h-4 w-4" /> Précédent</Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Enregistrement...' : (method === 'post' ? 'Créer le dossier' : 'Enregistrer les modifications')}
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </form>
    );
}

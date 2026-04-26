import { Head } from '@inertiajs/react';

import { CreditForm } from '@/components/credit/credit-form';
import CreditLayout from '@/layouts/credit/credit-layout';
import { store as creditStore } from '@/routes/credit';
import type { BreadcrumbItem, Country, CreditType } from '@/types';

interface CreateProps {
    countries: Country[];
    creditTypes: CreditType[];
    breadcrumbs: BreadcrumbItem[];
}

export default function Create({ countries, creditTypes, breadcrumbs }: CreateProps) {
    return (
        <CreditLayout breadcrumbs={breadcrumbs}>
            <Head title="Nouveau dossier" />

            <div className="mx-auto max-w-4xl py-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold">Créer un nouveau dossier de crédit</h1>
                    <p className="text-muted-foreground">Veuillez remplir les informations suivantes pour initialiser le dossier.</p>
                </div>

                <CreditForm
                    countries={countries}
                    creditTypes={creditTypes}
                    submitUrl={creditStore().url}
                />
            </div>
        </CreditLayout>
    );
}

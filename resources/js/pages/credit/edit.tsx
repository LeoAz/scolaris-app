import { Head } from '@inertiajs/react';

import { CreditForm } from '@/components/credit/credit-form';
import CreditLayout from '@/layouts/credit/credit-layout';
import { update as creditUpdate } from '@/routes/credit';
import type { BreadcrumbItem, Country, CreditRequest, CreditType } from '@/types';

interface EditProps {
    creditRequest: CreditRequest;
    countries: Country[];
    creditTypes: CreditType[];
    breadcrumbs: BreadcrumbItem[];
}

export default function Edit({ creditRequest, countries, creditTypes, breadcrumbs }: EditProps) {
    return (
        <CreditLayout breadcrumbs={breadcrumbs}>
            <Head title={`Modifier ${creditRequest.code}`} />

            <div className="mx-auto max-w-4xl py-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold">Modifier le dossier : {creditRequest.code}</h1>
                    <p className="text-muted-foreground">Mettez à jour les informations du dossier de crédit.</p>
                </div>

                <CreditForm
                    creditRequest={creditRequest}
                    countries={countries}
                    creditTypes={creditTypes}
                    submitUrl={creditUpdate({ creditRequest: creditRequest.id }).url}
                    method="put"
                />
            </div>
        </CreditLayout>
    );
}

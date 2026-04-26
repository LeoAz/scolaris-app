import { Head } from '@inertiajs/react';

import { LoansTable } from '@/components/dashboard/loans-table';
import type { LoanDetail } from '@/components/dashboard/loans-table';
import { RequestsByCountryChart } from '@/components/dashboard/requests-by-country-chart';
import type { RequestsByCountryData } from '@/components/dashboard/requests-by-country-chart';
import { ValidationRateChart } from '@/components/dashboard/validation-rate-chart';
import type { ValidationStatsData } from '@/components/dashboard/validation-rate-chart';

interface DashboardProps {
    requestsByCountry: RequestsByCountryData[];
    statsByCountry: ValidationStatsData[];
    loanDetails: {
        data: LoanDetail[];
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    countries: string[];
    filters: { search?: string; country?: string };
}

export default function Dashboard({ requestsByCountry, statsByCountry, loanDetails, countries, filters }: DashboardProps) {
    return (
        <>
            <Head title="Tableau de bord" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto p-4 pt-0 mt-5">
                <div className="grid gap-4 md:grid-cols-2">
                    <RequestsByCountryChart data={requestsByCountry} />
                    <ValidationRateChart data={statsByCountry} />
                    <LoansTable
                        pagination={loanDetails}
                        availableCountries={countries}
                        filters={filters}
                    />
                </div>
            </div>
        </>
    );
}

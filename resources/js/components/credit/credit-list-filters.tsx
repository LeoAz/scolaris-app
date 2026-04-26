import { Search } from 'lucide-react';
import { memo } from 'react';

import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Country } from '@/types';

interface CreditListFiltersProps {
    search: string;
    countryId: string;
    countries: Country[];
    onSearchChange: (value: string) => void;
    onCountryChange: (value: string) => void;
}

export const CreditListFilters = memo(({
    search,
    countryId,
    countries,
    onSearchChange,
    onCountryChange,
}: CreditListFiltersProps) => {
    return (
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
            <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Rechercher par code ou nom de l'étudiant..."
                    className="pl-9 h-8 rounded-lg border-border/50 bg-background/50 focus:bg-background transition-colors"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            <div className="w-full md:w-64">
                <Select value={countryId} onValueChange={onCountryChange}>
                    <SelectTrigger className="h-8 rounded-lg border-border/50 bg-background/50">
                        <SelectValue placeholder="Tous les pays" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous les pays</SelectItem>
                        {countries.map((country) => (
                            <SelectItem key={country.id} value={country.id.toString()}>
                                {country.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
});

CreditListFilters.displayName = 'CreditListFilters';

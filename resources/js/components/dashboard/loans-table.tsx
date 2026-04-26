import { router } from "@inertiajs/react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export interface LoanDetail {
    id: number;
    code: string;
    student_name: string;
    country: string;
    initial_contribution: number;
    amount: number;
    total_repaid: number;
    remaining: number;
}

interface PaginationMeta {
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface LoansTableProps {
    pagination: {
        data: LoanDetail[];
    } & PaginationMeta;
    availableCountries: string[];
    filters: { search?: string; country?: string };
}

export function LoansTable({ pagination, availableCountries, filters }: LoansTableProps) {
    const [searchQuery, setSearchQuery] = React.useState(filters.search || "");
    const [countryFilter, setCountryFilter] = React.useState(filters.country || "all");

    const handleFilterChange = (search: string, country: string) => {
        router.get(
            route("dashboard"),
            { search, country: country === "all" ? undefined : country },
            { preserveState: true, preserveScroll: true }
        );
    };

    // Debounce search
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery !== (filters.search || "")) {
                handleFilterChange(searchQuery, countryFilter);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const onCountryChange = (value: string) => {
        setCountryFilter(value);
        handleFilterChange(searchQuery, value);
    };

    const handlePageChange = (url: string | null) => {
        if (url) {
            router.get(url, {}, { preserveState: true, preserveScroll: true });
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(value);
    };

    return (
        <Frame className="col-span-full">
            <FramePanel>
                <FrameHeader>
                    <FrameTitle>Situation des dossiers</FrameTitle>
                    <FrameDescription>Détails des montants par étudiant et par pays</FrameDescription>
                </FrameHeader>
                <div className="p-5 pt-0">
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Rechercher un dossier ou étudiant..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        <div className="w-full md:w-48">
                            <Select value={countryFilter} onValueChange={onCountryChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filtrer par pays" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les pays</SelectItem>
                                    {availableCountries.map((country) => (
                                        <SelectItem key={country} value={country}>
                                            {country}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Dossier</TableHead>
                                    <TableHead>Étudiant</TableHead>
                                    <TableHead>Pays</TableHead>
                                    <TableHead className="text-right">Apport Initial</TableHead>
                                    <TableHead className="text-right">Montant</TableHead>
                                    <TableHead className="text-right">Remboursé</TableHead>
                                    <TableHead className="text-right">Restant</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pagination.data.length > 0 ? (
                                    pagination.data.map((loan) => (
                                        <TableRow key={loan.id}>
                                            <TableCell className="font-medium">{loan.code}</TableCell>
                                            <TableCell>{loan.student_name}</TableCell>
                                            <TableCell>{loan.country}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(loan.initial_contribution)}</TableCell>
                                            <TableCell className="text-right font-semibold">{formatCurrency(loan.amount)}</TableCell>
                                            <TableCell className="text-right text-green-600 dark:text-green-400">
                                                {formatCurrency(loan.total_repaid)}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-red-600 dark:text-red-400">
                                                {formatCurrency(loan.remaining)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            Aucun résultat trouvé.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {pagination.total > 0 && (
                        <div className="mt-4 flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                Affichage de <span className="font-medium">{pagination.from}</span> à <span className="font-medium">{pagination.to}</span> sur <span className="font-medium">{pagination.total}</span> résultats
                            </div>
                            <div className="flex items-center space-x-2">
                                {pagination.links.map((link, index) => {
                                    const isPrev = link.label.includes('Previous');
                                    const isNext = link.label.includes('Next');

                                    if (isPrev) {
                                        return (
                                            <Button
                                                key={index}
                                                variant="outline"
                                                size="sm"
                                                disabled={!link.url}
                                                onClick={() => handlePageChange(link.url)}
                                            >
                                                <ChevronLeft className="mr-1 h-4 w-4" /> Précédent
                                            </Button>
                                        );
                                    }

                                    if (isNext) {
                                        return (
                                            <Button
                                                key={index}
                                                variant="outline"
                                                size="sm"
                                                disabled={!link.url}
                                                onClick={() => handlePageChange(link.url)}
                                            >
                                                Suivant <ChevronRight className="ml-1 h-4 w-4" />
                                            </Button>
                                        );
                                    }

                                    // Render page numbers only if they are numbers
                                    if (!isNaN(Number(link.label))) {
                                        return (
                                            <Button
                                                key={index}
                                                variant={link.active ? "default" : "outline"}
                                                size="sm"
                                                className="h-9 w-9"
                                                onClick={() => handlePageChange(link.url)}
                                            >
                                                {link.label}
                                            </Button>
                                        );
                                    }

                                    return null;
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </FramePanel>
        </Frame>
    );
}

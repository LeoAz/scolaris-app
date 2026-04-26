import { router, usePage } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Search, Inbox } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface DataTableProps<T> {
    data: T[];
    columns: {
        header: string;
        accessorKey: keyof T | string;
        cell?: (item: T) => React.ReactNode;
    }[];
    meta?: {
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    onSearch?: (term: string) => void;
    filters?: React.ReactNode;
    isLoading?: boolean;
}

export function DataTable<T>({
    data,
    columns,
    meta,
    onSearch,
    filters,
    isLoading: externalLoading
}: DataTableProps<T>) {
    const { url } = usePage();
    const termFromUrl = React.useMemo(() => {
        const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');

        return params.get('search') || '';
    }, [url]);

    const [searchTerm, setSearchTerm] = React.useState(termFromUrl);

    // Sync state with URL only if they differ (e.g. on navigation)
    // We use a separate state to track the last url we synced with
    const [lastSyncedUrl, setLastSyncedUrl] = React.useState(url);

    if (lastSyncedUrl !== url) {
        setLastSyncedUrl(url);

        if (termFromUrl !== searchTerm) {
            setSearchTerm(termFromUrl);
        }
    }

    const [internalLoading, setInternalLoading] = React.useState(false);
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const isLoading = externalLoading || internalLoading;

    // Debounced search
    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const currentSearch = params.get('search') || '';

        if (debouncedSearchTerm !== currentSearch) {
            onSearch?.(debouncedSearchTerm);
        }
    }, [debouncedSearchTerm, onSearch]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch?.(searchTerm);
    };

    const handlePageChange = (url: string | null) => {
        if (url) {
            setInternalLoading(true);
            router.get(url, {}, {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setInternalLoading(false)
            });
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <form onSubmit={handleSearch} className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Rechercher..."
                        className="pl-8 h-8 rounded-lg bg-background"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button type="submit" className="hidden">Rechercher</Button>
                </form>

                {filters && (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        {filters}
                    </div>
                )}
            </div>

            <div className="rounded-xl border bg-background shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            {columns.map((column, index) => (
                                <TableHead key={index} className="font-semibold">{column.header}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, rowIndex) => (
                                <TableRow key={rowIndex}>
                                    {columns.map((_, colIndex) => (
                                        <TableCell key={colIndex}>
                                            <Skeleton className="h-5 w-full rounded-md" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : data.length > 0 ? (
                            data.map((item, rowIndex) => (
                                <TableRow key={rowIndex} className="hover:bg-muted/30 transition-colors">
                                    {columns.map((column, colIndex) => (
                                        <TableCell key={colIndex}>
                                            {column.cell
                                                ? column.cell(item)
                                                : (item[column.accessorKey as keyof T] as React.ReactNode)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-48 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground space-y-2">
                                        <Inbox className="h-10 w-10 opacity-20" />
                                        <p className="text-sm font-medium">Aucun résultat trouvé</p>
                                        <p className="text-xs opacity-70">Essayez de modifier vos critères de recherche.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {meta && meta.total > 0 && !isLoading && (
                <div className="flex items-center justify-between px-2 pt-2">
                    <div className="text-sm text-muted-foreground font-medium">
                        Affichage de <span className="text-foreground">{meta.from}</span> à <span className="text-foreground">{meta.to}</span> sur <span className="text-foreground">{meta.total}</span> résultats
                    </div>
                    <div className="flex items-center space-x-1">
                        {meta.links.map((link, index) => {
                            const isPrev = link.label.includes('Previous');
                            const isNext = link.label.includes('Next');

                            if (isPrev) {
                                return (
                                    <Button
                                        key={index}
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        disabled={!link.url}
                                        onClick={() => handlePageChange(link.url)}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                );
                            }

                            if (isNext) {
                                return (
                                    <Button
                                        key={index}
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        disabled={!link.url}
                                        onClick={() => handlePageChange(link.url)}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                );
                            }

                            const isPageNumber = !isNaN(Number(link.label));

                            if (!isPageNumber) {
                                return null;
                            }

                            return (
                                <Button
                                    key={index}
                                    variant={link.active ? 'default' : 'outline'}
                                    className={cn(
                                        "h-8 w-8 text-xs",
                                        link.active && "shadow-sm shadow-primary/20"
                                    )}
                                    onClick={() => handlePageChange(link.url)}
                                >
                                    {link.label}
                                </Button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}

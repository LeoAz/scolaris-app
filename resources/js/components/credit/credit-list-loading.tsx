import { memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const CreditListLoading = memo(() => (
    <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 w-full rounded-xl border border-border bg-card p-6 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                    <div className="flex gap-4 items-center">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <div className="flex justify-between items-end mt-auto">
                    <div className="flex gap-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-9 w-9 rounded-md" />
                        <Skeleton className="h-9 w-9 rounded-md" />
                    </div>
                </div>
            </div>
        ))}
    </div>
));

CreditListLoading.displayName = 'CreditListLoading';

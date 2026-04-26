import { usePage } from '@inertiajs/react';
import { useMemo } from 'react';
import AppLayoutTemplate from '@/layouts/app/app-header-layout';

export default function AppLayout({
    children,
    breadcrumbs,
}: {
    children: React.ReactNode;
    breadcrumbs?: any[];
}) {
    const page = usePage();
    const pageBreadcrumbs = page.props.breadcrumbs as any[] | undefined;

    const finalBreadcrumbs = useMemo(
        () => breadcrumbs || pageBreadcrumbs || [],
        [breadcrumbs, pageBreadcrumbs]
    );

    return (
        <AppLayoutTemplate breadcrumbs={finalBreadcrumbs}>
            {children}
        </AppLayoutTemplate>
    );
}

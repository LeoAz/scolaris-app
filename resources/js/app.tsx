import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';

const appName = import.meta.env.VITE_APP_NAME || 'SCOLARIS FINANCE';

// Debug rechargement
if (import.meta.env.DEV && !import.meta.env.SSR) {
    document.addEventListener('inertia:version', (event: any) => {
        console.warn('Inertia asset version mismatch detected. Blocking reload.');
        event.preventDefault();
    });

    if (import.meta.hot) {
        import.meta.hot.on('vite:beforeFullReload', (payload) => {
            console.warn('Vite full reload intercepted:', payload);
        });

        // Tenter d'intercepter les erreurs HMR qui causent des rechargements
        import.meta.hot.on('vite:error', (data) => {
            console.error('Vite HMR error:', data);
        });
    }

    // Intercepter window.location.reload si possible (en lecture seule souvent, mais on peut essayer de proxyfier window.location)
    // Note: C'est complexe car window.location est spécial. On va plutôt surveiller beforeunload.
    window.addEventListener('beforeunload', () => {
        console.warn('Application is unloading (beforeunload). Check call stack if possible.');
    });
}

const AppLayout = React.lazy(() => import('@/layouts/app-layout'));
const AuthLayout = React.lazy(() => import('@/layouts/auth-layout'));
const SettingsLayout = React.lazy(() => import('@/layouts/settings/layout'));
const AdminLayout = React.lazy(() => import('@/layouts/admin/admin-layout'));

const Layouts = {
    Auth: (page: React.ReactNode) => (
        <React.Suspense fallback={null}>
            <AuthLayout {...(page as any).props.layout}>{page}</AuthLayout>
        </React.Suspense>
    ),
    Settings: (page: React.ReactNode) => (
        <React.Suspense fallback={null}>
            <AppLayout>
                <SettingsLayout>{page}</SettingsLayout>
            </AppLayout>
        </React.Suspense>
    ),
    Admin: (page: React.ReactNode) => (
        <React.Suspense fallback={null}>
            {page}
        </React.Suspense>
    ),
    App: (page: React.ReactNode) => (
        <React.Suspense fallback={null}>
            <AppLayout>{page}</AppLayout>
        </React.Suspense>
    ),
};

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) => {
        const pages = import.meta.glob('./pages/**/*.tsx');
        const page: any = pages[`./pages/${name}.tsx`];

        if (!page) {
            throw new Error(`Page not found: ./pages/${name}.tsx`);
        }

        return page().then((module: any) => {
            module.default.layout =
                module.default.layout ||
                (name === 'welcome'
                    ? null
                    : name.startsWith('auth/')
                      ? Layouts.Auth
                      : name.startsWith('settings/')
                        ? Layouts.Settings
                        : name.startsWith('admin/')
                          ? Layouts.Admin
                        : Layouts.App);

            return module;
        });
    },
    strictMode: true,
    setup({ el, App, props }) {
        if (import.meta.env.SSR) {
            hydrateRoot(
                el,
                <TooltipProvider delayDuration={0}>
                    <App {...props} />
                    <Toaster />
                </TooltipProvider>,
            );

            return;
        }

// Utiliser une propriété sur l'élément DOM pour stocker le root
// Cela évite les problèmes de double-root quand le HMR recharge ce fichier
const elAny = el as any;

const app = (
    <TooltipProvider delayDuration={0}>
        <App {...props} />
        <Toaster />
    </TooltipProvider>
);

if (elAny._reactRoot) {
    elAny._reactRoot.render(app);
} else {
    elAny._reactRoot = createRoot(el);
    elAny._reactRoot.render(app);
}
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
if (!import.meta.env.SSR) {
    initializeTheme();
}

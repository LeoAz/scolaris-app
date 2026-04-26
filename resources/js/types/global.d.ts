import type { Auth } from '@/types/auth';
import type { NotificationProps } from '@/types/notifications';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            notifications: NotificationProps;
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}

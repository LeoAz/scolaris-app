import { usePage } from '@inertiajs/react';
import type { Auth } from '@/types';

export function usePermission() {
    const { auth } = usePage().props as unknown as { auth: Auth };

    const hasPermission = (permission?: string): boolean => {
        const user = auth.user;

        if (!user) {
            return false;
        }

        const roles = user.roles || [];

        // L'accès au tableau de bord ou l'absence de permission spécifique est autorisé par défaut
        // ou si l'utilisateur est un administrateur.
        if (roles.includes('Super admin') || roles.includes('Administrateur') || roles.includes('Super Administrateur')) {
            return true;
        }

        if (permission === 'dashboard') {
            return false; // Seuls les admins (gérés au-dessus) ont accès au dashboard selon la logique existante
        }

        if (!permission) {
            return true;
        }

        const userPermissions = user.permissions || [];

        return userPermissions.includes(permission);
    };

    const hasAnyPermission = (permissions: string[]): boolean => {
        return permissions.some((permission) => hasPermission(permission));
    };

    return { hasPermission, hasAnyPermission };
}

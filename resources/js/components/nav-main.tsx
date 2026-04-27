import { Link } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();
    const { auth } = usePage().props;

    const hasPermission = (permission?: string) => {
        const roles = (auth.user?.roles as any[])?.map((r: any) => typeof r === 'string' ? r : r.name) || [];

        if (roles.includes('Super admin') || roles.includes('Administrateur') || roles.includes('Super Administrateur')) {
            return true;
        }

        if (!permission) {
            return true;
        }

        const userPermissions = (auth.user?.permissions as any[])?.map((p: any) => typeof p === 'string' ? p : p.name) || [];

        return userPermissions.includes(permission);
    };

    const filteredItems = items.filter((item) => hasPermission(item.permission));

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {filteredItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={isCurrentUrl(item.href)}
                            tooltip={{ children: item.title }}
                        >
                            <Link href={item.href} prefetch>
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}

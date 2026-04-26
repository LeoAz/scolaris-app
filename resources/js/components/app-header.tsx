import { Link, usePage } from "@inertiajs/react";
import {
    LayoutGrid,
    SearchIcon,
    ShieldCheck,
    FolderOpen,
    Users,
    CircleDollarSign,
    UserX,
    BarChart3,
} from "lucide-react";
import { useId } from "react";

import AppLogo from "@/components/app-logo";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { NotificationDropdown } from "@/components/notification-dropdown";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { UserMenuContent } from "@/components/user-menu-content";
import { useInitials } from "@/hooks/use-initials";
import { cn } from "@/lib/utils";
import { dashboard } from "@/routes";
import { index as adminUsersIndex } from "@/routes/admin/users";
import { index as creditIndex } from "@/routes/credit";
import { index as recoveryIndex } from "@/routes/credit/recovery";
import { index as terminationIndex } from "@/routes/credit/termination-requests/index";
import { students as studentsIndex } from "@/routes/stakeholders";
import type { NavItem, BreadcrumbItem } from "@/types";

interface NavItemWithActive extends NavItem {
    activePath?: string;
    permission?: string;
}

const mainNavItems: NavItemWithActive[] = [
    {
        title: "Tableau de bord",
        href: dashboard().url,
        icon: LayoutGrid,
        permission: "dashboard",
    },
    {
        title: "Administration",
        href: adminUsersIndex().url,
        activePath: "/admin",
        icon: ShieldCheck,
        permission: "admin.users.index",
    },
    {
        title: "Gestion des dossiers",
        href: creditIndex().url,
        activePath: "/credit",
        icon: FolderOpen,
        permission: "credit.index",
    },
    {
        title: "Etudiants & garants",
        href: studentsIndex().url,
        activePath: "/stakeholders",
        icon: Users,
        permission: "stakeholders.students",
    },
    {
        title: "Recouvrement",
        href: recoveryIndex().url,
        activePath: "/credit/recovery",
        icon: CircleDollarSign,
        permission: "credit.recovery.index",
    },
    {
        title: "Résiliation",
        href: terminationIndex().url,
        activePath: "/credit/termination-requests",
        icon: UserX,
        permission: "credit.termination-requests.index",
    },
    {
        title: "Rapport",
        href: dashboard().url,
        icon: BarChart3,
        permission: "dashboard",
    },
];

const activeItemStyles = "text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100";

function isPathMatch(currentPath: string, targetPath: string): boolean {
    const current = currentPath.replace(/\/$/, "");
    const target = targetPath.replace(/\/$/, "");

    return current === target || current.startsWith(target + "/");
}

function isNavItemActive(item: NavItemWithActive, currentPath: string): boolean {
    const path = item.activePath ?? item.href;

    if (!isPathMatch(currentPath, path)) {
        return false;
    }

    // Ensure a more specific item doesn't take priority (e.g. "/credit/recovery" over "/credit")
    return !mainNavItems.some((other) => {
        if (other === item) {
            return false;
        }

        const otherPath = other.activePath ?? other.href;

        return otherPath.startsWith(path) && otherPath.length > path.length && isPathMatch(currentPath, otherPath);
    });
}

export function AppHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItem[] }) {
    const id = useId();
    const page = usePage();
    const { auth } = page.props;
    const getInitials = useInitials();
    const currentPath = page.url.split("?")[0];

    const hasPermission = (permission?: string) => {
        const roles = (auth.user?.roles as any[])?.map((r: any) => typeof r === 'string' ? r : r.name) || [];

        if (roles.includes('Super admin') || roles.includes('Administrateur')) {
            return true;
        }

        if (!permission) {
            return true;
        }

        const userPermissions = (auth.user?.permissions as any[])?.map((p: any) => typeof p === 'string' ? p : p.name) || [];

        return userPermissions.includes(permission);
    };

    const filteredNavItems = mainNavItems.filter((item) => hasPermission(item.permission));

    return (
        <header className="border-b px-4">
            <div className="mx-auto flex h-16 items-center justify-between gap-4 md:max-w-7xl">
                {/* Left side */}
                <div className="flex flex-1 items-center gap-2">
                    {/* Mobile menu trigger */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button className="group size-8 md:hidden" size="icon" variant="ghost">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="lucide lucide-menu size-4"
                                    aria-hidden="true"
                                >
                                    <path d="M4 12h16" />
                                    <path d="M4 6h16" />
                                    <path d="M4 18h16" />
                                </svg>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-48 p-1 md:hidden">
                            <NavigationMenu className="max-w-none *:w-full">
                                <NavigationMenuList className="flex-col items-start gap-0">
                                    {filteredNavItems.map((item) => (
                                        <NavigationMenuItem className="w-full" key={item.title}>
                                            <NavigationMenuLink
                                                asChild
                                                active={isNavItemActive(item, currentPath)}
                                                className="py-1.5"
                                            >
                                                <Link href={item.href} className="flex items-center">
                                                    {item.icon && <item.icon className="mr-2 size-4" aria-hidden="true" />}
                                                    {item.title}
                                                </Link>
                                            </NavigationMenuLink>
                                        </NavigationMenuItem>
                                    ))}
                                </NavigationMenuList>
                            </NavigationMenu>
                        </PopoverContent>
                    </Popover>
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href={dashboard().url} className="flex items-center gap-2">
                            <AppLogo />
                        </Link>
                    </div>
                </div>
                {/* Middle area */}
                <div className="grow">
                    {/* Search form */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            // Implémenter la recherche si nécessaire
                        }}
                        className="relative mx-auto w-full max-w-xs"
                    >
                        <Input className="peer h-8 ps-8 pe-10" id={id} placeholder="Search..." type="search" />
                        <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-2 text-muted-foreground/80 peer-disabled:opacity-50">
                            <SearchIcon size={16} aria-hidden="true" />
                        </div>
                        <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-2 text-muted-foreground">
                            <kbd className="inline-flex h-5 max-h-full items-center rounded border px-1 font-[inherit] font-medium text-[0.625rem] text-muted-foreground/70">
                                ⌘K
                            </kbd>
                        </div>
                    </form>
                </div>
                {/* Right side */}
                <div className="flex flex-1 items-center justify-end gap-2">
                    <NotificationDropdown />

                    {/* User menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="size-10 rounded-full p-1">
                                <Avatar className="size-8 overflow-hidden rounded-full">
                                    <AvatarImage src={auth.user?.avatar} alt={auth.user?.name} />
                                    <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                        {getInitials(auth.user?.name ?? "")}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end">
                            {auth.user && <UserMenuContent user={auth.user} />}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            {/* Bottom navigation */}
            <div className="relative flex items-center justify-center border-t py-2">
                <NavigationMenu className="max-md:hidden">
                    <NavigationMenuList className="gap-2">
                        {filteredNavItems.map((item) => (
                            <NavigationMenuItem key={item.title} className="relative">
                                <NavigationMenuLink
                                    asChild
                                    active={isNavItemActive(item, currentPath)}
                                    className={cn(
                                        navigationMenuTriggerStyle(),
                                        isNavItemActive(item, currentPath) && activeItemStyles,
                                        "h-9 cursor-pointer px-3 font-medium",
                                    )}
                                >
                                    <Link href={item.href}>
                                        {item.icon && <item.icon className="mr-2 size-4" aria-hidden="true" />}
                                        {item.title}
                                    </Link>
                                </NavigationMenuLink>
                                {isNavItemActive(item, currentPath) && (
                                    <div className="absolute bottom-0 left-0 h-0.5 w-full translate-y-[9px] bg-black dark:bg-white"></div>
                                )}
                            </NavigationMenuItem>
                        ))}
                    </NavigationMenuList>
                </NavigationMenu>
            </div>
            {breadcrumbs.length > 0 && (
                <div className="mx-auto flex w-full items-center justify-start border-t px-4 py-4 md:max-w-7xl">
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
            )}
        </header>
    );
}

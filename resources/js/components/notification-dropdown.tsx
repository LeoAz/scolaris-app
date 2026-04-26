import { router, usePage } from "@inertiajs/react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Bell } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { index, markAllAsRead, markAsRead } from "@/actions/App/Http/Controllers/NotificationController";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { NotificationProps } from "@/types/notifications";

export function NotificationDropdown() {
    const { auth, notifications } = usePage().props as unknown as { auth: { user: { unread_notifications_count: number } }, notifications: NotificationProps };
    const { list } = notifications;
    const unread_count = auth.user?.unread_notifications_count ?? 0;
    const prevUnreadCount = useRef(unread_count);

    useEffect(() => {
        if (unread_count > prevUnreadCount.current) {
            const newNotification = list[0];

            if (newNotification) {
                toast(newNotification.data.message, {
                    description: formatDistanceToNow(new Date(newNotification.created_at), {
                        addSuffix: true,
                        locale: fr,
                    }),
                    action: newNotification.data.url ? {
                        label: "Voir",
                        onClick: () => router.visit(newNotification.data.url!),
                    } : undefined,
                    position: "top-right",
                });
            }
        }

        prevUnreadCount.current = unread_count;
    }, [unread_count]);

    const handleMarkAsRead = (id: string) => {
        router.post(markAsRead.url(id), {}, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const handleMarkAllAsRead = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        router.post(markAllAsRead.url(), {}, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="size-5" />
                    {unread_count > 0 && (
                        <Badge
                            className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full px-1 py-0 text-[10px]"
                            variant="destructive"
                            title={`${unread_count} notifications non lues`}
                        >
                            {unread_count > 9 ? "9+" : unread_count}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {unread_count > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto px-2 py-1 text-xs font-normal"
                            onClick={handleMarkAllAsRead}
                        >
                            Tout marquer comme lu
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[300px]">
                    {list.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                            <Bell className="mb-2 size-8 text-muted-foreground opacity-20" />
                            <p className="text-sm text-muted-foreground">Aucune notification</p>
                        </div>
                    ) : (
                        list.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className={cn(
                                    "flex flex-col items-start gap-1 p-4 focus:bg-accent",
                                    !notification.read_at && "bg-muted/50 font-medium"
                                )}
                                onClick={() => handleMarkAsRead(notification.id)}
                            >
                                <div className="flex w-full items-start justify-between gap-2">
                                    <span className="text-sm">{notification.data.message}</span>
                                    {!notification.read_at && (
                                        <div className="mt-1.5 size-2 shrink-0 rounded-full bg-blue-600" />
                                    )}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(notification.created_at), {
                                        addSuffix: true,
                                        locale: fr,
                                    })}
                                </span>
                                {notification.data.url && (
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="mt-1 h-auto p-0 text-xs text-blue-600"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.visit(notification.data.url!);
                                        }}
                                    >
                                        Voir les détails
                                    </Button>
                                )}
                            </DropdownMenuItem>
                        ))
                    )}
                </ScrollArea>
                <DropdownMenuSeparator />
                <Sheet>
                    <SheetTrigger asChild>
                        <DropdownMenuItem
                            className="p-0"
                            onSelect={(e) => e.preventDefault()}
                        >
                            <Button
                                variant="ghost"
                                className="flex w-full justify-center p-2 text-xs text-muted-foreground hover:text-foreground"
                            >
                                Voir toutes les notifications
                            </Button>
                        </DropdownMenuItem>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-full sm:max-w-md">
                        <SheetHeader>
                            <SheetTitle>Toutes les notifications</SheetTitle>
                            <SheetDescription>
                                Historique complet de vos notifications.
                            </SheetDescription>
                        </SheetHeader>
                        <NotificationList />
                    </SheetContent>
                </Sheet>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function NotificationList() {
    const { all_notifications } = usePage().props as unknown as { all_notifications: any };
    const fetched = useRef(false);

    // This component will be populated when the sheet opens or via an initial request
    // For now, let's make it fetch data when it mounts if not present
    useEffect(() => {
        if (!all_notifications && !fetched.current) {
            fetched.current = true;
            router.get(index.url(), {}, {
                preserveState: true,
                preserveScroll: true,
                only: ['all_notifications'],
            });
        }
    }, []); // Remove dependency to prevent infinite loop

    const list = all_notifications?.data || [];

    return (
        <ScrollArea className="flex-1">
            <div className="flex flex-col divide-y">
                {list.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Bell className="mb-2 size-12 text-muted-foreground opacity-20" />
                        <p className="text-sm text-muted-foreground">Aucune notification</p>
                    </div>
                ) : (
                    list.map((notification: any) => (
                        <div
                            key={notification.id}
                            className={cn(
                                "flex flex-col items-start gap-1 p-4",
                                !notification.read_at && "bg-muted/30 font-medium"
                            )}
                        >
                            <div className="flex w-full items-start justify-between gap-2">
                                <span className="text-sm">{notification.data.message}</span>
                                {!notification.read_at && (
                                    <div className="mt-1.5 size-2 shrink-0 rounded-full bg-blue-600" />
                                )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(notification.created_at), {
                                    addSuffix: true,
                                    locale: fr,
                                })}
                            </span>
                            {notification.data.url && (
                                <Button
                                    variant="link"
                                    size="sm"
                                    className="mt-1 h-auto p-0 text-xs text-blue-600"
                                    onClick={() => router.visit(notification.data.url!)}
                                >
                                    Voir les détails
                                </Button>
                            )}
                        </div>
                    ))
                )}
                {all_notifications?.meta?.next_page_url && (
                    <div className="p-4">
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                                // Handle pagination if needed, or just redirect to index page
                                router.visit(index.url());
                            }}
                        >
                            Voir plus sur la page dédiée
                        </Button>
                    </div>
                )}
            </div>
        </ScrollArea>
    );
}

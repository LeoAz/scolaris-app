import { Head, router } from "@inertiajs/react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Bell, CheckCircle, ExternalLink } from "lucide-react";

import { markAllAsRead, markAsRead } from "@/actions/App/Http/Controllers/NotificationController";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types";

interface Props {
    all_notifications: {
        data: Notification[];
        links: any[];
        meta: any;
    };
}

export default function NotificationsIndex({ all_notifications }: Props) {
    const handleMarkAsRead = (id: string) => {
        router.post(markAsRead.url(id), {}, {
            preserveScroll: true,
        });
    };

    const handleMarkAllAsRead = () => {
        router.post(markAllAsRead.url(), {}, {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Notifications" />

            <div className="mx-auto max-w-5xl space-y-8 p-6 md:p-10">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight">Vos Notifications</h1>
                        <p className="text-muted-foreground">
                            Gérez et consultez toutes vos notifications système.
                        </p>
                    </div>
                    {all_notifications.data.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleMarkAllAsRead}
                            className="w-fit"
                        >
                            <CheckCircle className="mr-2 size-4" />
                            Tout marquer comme lu
                        </Button>
                    )}
                </div>

                <div className="grid gap-6">
                    {all_notifications.data.length === 0 ? (
                        <Card className="flex flex-col items-center justify-center border-dashed py-20 text-center">
                            <CardContent className="space-y-4">
                                <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-muted">
                                    <Bell className="size-8 text-muted-foreground opacity-40" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-semibold">Aucune notification</h3>
                                    <p className="mx-auto max-w-xs text-muted-foreground">
                                        Vous n'avez pas encore reçu de notifications. Tout est à jour !
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="overflow-hidden">
                            <CardHeader className="sr-only">
                                <CardTitle>Liste des notifications</CardTitle>
                                <CardDescription>Historique complet de vos notifications</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-border">
                                    {all_notifications.data.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={cn(
                                                "group relative flex flex-col gap-4 p-6 transition-all hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between",
                                                !notification.read_at && "bg-muted/50"
                                            )}
                                        >
                                            {!notification.read_at && (
                                                <div className="absolute left-0 top-0 h-full w-1 bg-primary" />
                                            )}
                                            <div className="flex items-start gap-4">
                                                <div
                                                    className={cn(
                                                        "mt-1.5 size-2.5 shrink-0 rounded-full",
                                                        notification.read_at ? "bg-muted-foreground/30" : "bg-primary animate-pulse"
                                                    )}
                                                />
                                                <div className="space-y-1.5">
                                                    <p className={cn(
                                                        "text-sm leading-relaxed",
                                                        !notification.read_at ? "font-semibold text-foreground" : "text-muted-foreground"
                                                    )}>
                                                        {notification.data.message}
                                                    </p>
                                                    <p className="text-xs font-medium text-muted-foreground/80">
                                                        {formatDistanceToNow(new Date(notification.created_at), {
                                                            addSuffix: true,
                                                            locale: fr,
                                                        })}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 pl-6 sm:pl-0">
                                                {!notification.read_at && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleMarkAsRead(notification.id)}
                                                        className="h-8 text-xs font-medium hover:bg-primary/10 hover:text-primary"
                                                    >
                                                        Marquer comme lu
                                                    </Button>
                                                )}
                                                {notification.data.url && (
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => router.visit(notification.data.url!)}
                                                        className="h-8 text-xs font-medium"
                                                    >
                                                        <ExternalLink className="mr-1.5 size-3.5" />
                                                        Voir les détails
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Pagination */}
                    {all_notifications.meta && all_notifications.meta.last_page > 1 && (
                        <div className="flex items-center justify-center gap-2 py-8">
                            {all_notifications.links.map((link, i) => (
                                <Button
                                    key={i}
                                    variant={link.active ? "default" : "outline"}
                                    size="sm"
                                    disabled={!link.url}
                                    onClick={() => link.url && router.visit(link.url)}
                                    className={cn(
                                        "h-9 px-4",
                                        link.active ? "" : "hover:bg-muted"
                                    )}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

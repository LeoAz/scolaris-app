<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class UserCreatedNotification extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public string $password)
    {
        //
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $roles = $notifiable->roles->pluck('name')->implode(', ');
        $permissions = $notifiable->getAllPermissions()->pluck('name')->implode(', ');

        return (new MailMessage)
            ->subject('Votre compte a été créé - '.config('app.name'))
            ->greeting('Bonjour '.$notifiable->name.',')
            ->line('Votre compte a été créé avec succès sur '.config('app.name').'.')
            ->line('Voici vos informations de connexion :')
            ->line('Identifiant / Email : '.$notifiable->email.' ou '.$notifiable->username)
            ->line('Mot de passe temporaire : '.$this->password)
            ->line('Rôles : '.$roles)
            ->line('Permissions : '.$permissions)
            ->action('Se connecter', url('/login'))
            ->line('Il vous sera demandé de changer votre mot de passe lors de votre première connexion.')
            ->line('Merci d\'utiliser notre application !');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            //
        ];
    }
}

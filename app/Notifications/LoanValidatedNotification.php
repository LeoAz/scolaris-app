<?php

namespace App\Notifications;

use App\Models\CreditRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LoanValidatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public CreditRequest $creditRequest)
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
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Dossier de crédit validé - '.$this->creditRequest->code)
            ->greeting('Bonjour '.$notifiable->name.',')
            ->line('Le dossier de crédit suivant a été validé :')
            ->line('**Code :** '.$this->creditRequest->code)
            ->line('**Étudiant :** '.($this->creditRequest->student->full_name ?? $this->creditRequest->student->last_name.' '.$this->creditRequest->student->first_name))
            ->line('**Montant :** '.number_format($this->creditRequest->amount_requested, 0, ',', ' ').' FCFA')
            ->action('Voir le dossier', url('/credit/requests/'.$this->creditRequest->id))
            ->line('Le tableau d\'amortissement a été généré et est disponible dans les détails du dossier.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'credit_request_id' => $this->creditRequest->id,
            'code' => $this->creditRequest->code,
            'message' => 'Le dossier de crédit '.$this->creditRequest->code.' a été validé.',
            'type' => 'loan_validated',
        ];
    }
}

<?php

namespace App\Notifications;

use App\Models\CreditRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CreditRequestSubmitted extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public CreditRequest $creditRequest) {}

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
     * Determine if the notification should be sent.
     */
    public function shouldSend(object $notifiable, string $channel): bool
    {
        if ($channel === 'mail') {
            return true;
        }

        // Pour la base de données, on évite les doublons si nécessaire
        // Mais ici on veut surtout s'assurer qu'elle est traitée rapidement
        return true;
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $countryName = $this->creditRequest->country->name;
        $studentName = $this->creditRequest->student->full_name;
        $amount = number_format($this->creditRequest->amount_requested, 0, ',', ' ').' XOF';

        return (new MailMessage)
            ->subject('Soumission d\'un nouveau dossier de prêt - '.$this->creditRequest->code)
            ->greeting('Bonjour,')
            ->line('Un nouveau dossier de prêt vient d\'être soumis pour validation.')
            ->line('**Détails du dossier :**')
            ->line('Code : '.$this->creditRequest->code)
            ->line('Pays : '.$countryName)
            ->line('Étudiant : '.$studentName)
            ->line('Montant demandé : '.$amount)
            ->action('Accéder au dossier', route('credit.show', $this->creditRequest->id))
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
            'credit_request_id' => $this->creditRequest->id,
            'code' => $this->creditRequest->code,
            'student_name' => $this->creditRequest->student->full_name,
            'message' => 'Le dossier de crédit '.$this->creditRequest->code.' a été soumis pour validation.',
            'url' => route('credit.show', $this->creditRequest->id),
            'type' => 'submission',
        ];
    }
}

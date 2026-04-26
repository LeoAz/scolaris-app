<?php

namespace App\Notifications;

use App\Models\CreditRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CreditRequestRejected extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public CreditRequest $creditRequest, public ?string $reason = null) {}

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
        $studentName = $this->creditRequest->student->full_name;
        $amount = number_format($this->creditRequest->amount_requested, 0, ',', ' ').' XOF';

        $mailMessage = (new MailMessage)
            ->subject('Rejet du dossier de prêt - '.$this->creditRequest->code)
            ->greeting('Bonjour,')
            ->line('Le dossier de prêt suivant a été rejeté.')
            ->line('**Détails du dossier :**')
            ->line('Code : '.$this->creditRequest->code)
            ->line('Étudiant : '.$studentName)
            ->line('Montant : '.$amount);

        if ($this->reason) {
            $mailMessage->line('**Motif du rejet :** '.$this->reason);
        }

        return $mailMessage
            ->action('Voir le dossier', route('credit.show', $this->creditRequest->id))
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
            'message' => 'Le dossier de crédit '.$this->creditRequest->code.' a été rejeté.',
            'reason' => $this->reason,
            'url' => route('credit.show', $this->creditRequest->id),
            'type' => 'rejection',
        ];
    }
}

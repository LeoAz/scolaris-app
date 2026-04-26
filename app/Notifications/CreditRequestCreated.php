<?php

namespace App\Notifications;

use App\Models\CreditRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CreditRequestCreated extends Notification implements ShouldQueue
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
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $status = $this->creditRequest->is_complete ? 'Complet' : 'Incomplet';
        $countryName = $this->creditRequest->country->name;
        $studentName = $this->creditRequest->student->full_name;
        $amount = number_format($this->creditRequest->amount_requested, 0, ',', ' ').' XOF';

        return (new MailMessage)
            ->subject('Nouveau dossier de crédit créé - '.$this->creditRequest->code)
            ->greeting('Bonjour,')
            ->line('Un nouveau dossier de crédit a été créé dans le système.')
            ->line('**Informations du dossier :**')
            ->line('Code : '.$this->creditRequest->code)
            ->line('Pays : '.$countryName)
            ->line('Étudiant : '.$studentName)
            ->line('Montant demandé : '.$amount)
            ->line('État du dossier : '.$status)
            ->action('Voir les détails du dossier', route('credit.show', $this->creditRequest->id))
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
            'amount' => $this->creditRequest->amount_requested,
            'message' => 'Un nouveau dossier de crédit '.$this->creditRequest->code.' a été créé.',
            'url' => route('credit.show', $this->creditRequest->id),
        ];
    }
}

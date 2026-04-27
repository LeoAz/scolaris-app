<?php

namespace App\Notifications;

use App\Models\CreditRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LoanClosedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public CreditRequest $creditRequest) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $countryName = $this->creditRequest->country->name;
        $studentName = $this->creditRequest->student->full_name;

        return (new MailMessage)
            ->subject('Dossier de crédit clôturé - '.$this->creditRequest->code)
            ->greeting('Bonjour,')
            ->line('Le dossier de crédit suivant a été clôturé.')
            ->line('**Informations du dossier :**')
            ->line('Code : '.$this->creditRequest->code)
            ->line('Pays : '.$countryName)
            ->line('Étudiant : '.$studentName)
            ->action('Voir les détails du dossier', route('credit.show', $this->creditRequest->id))
            ->line('Merci d\'utiliser notre application !');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'credit_request_id' => $this->creditRequest->id,
            'code' => $this->creditRequest->code,
            'student_name' => $this->creditRequest->student->full_name,
            'message' => 'Le dossier de crédit '.$this->creditRequest->code.' a été clôturé.',
            'url' => route('credit.show', $this->creditRequest->id),
        ];
    }
}

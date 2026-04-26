<?php

namespace App\Notifications;

use App\Models\CreditRequestRepayment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RecoveryRecorded extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public CreditRequestRepayment $repayment) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $creditRequest = $this->repayment->creditRequest;
        $student = $creditRequest->student;
        $amount = number_format($this->repayment->amount, 0, ',', ' ').' XOF';

        return (new MailMessage)
            ->subject('Nouveau recouvrement saisi - '.$creditRequest->code)
            ->greeting('Bonjour '.$notifiable->name.',')
            ->line('Un nouveau recouvrement a été saisi et est en attente de validation.')
            ->line('**Dossier :** '.$creditRequest->code)
            ->line('**Étudiant :** '.$student->first_name.' '.$student->last_name)
            ->line('**Montant :** '.$amount)
            ->line('**Méthode de paiement :** '.$this->repayment->payment_method)
            ->line('**Date de paiement :** '.$this->repayment->repayment_date->format('d/m/Y'))
            ->action('Voir le recouvrement', route('credit.recovery.index'))
            ->line('Veuillez valider ou rejeter ce recouvrement.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $creditRequest = $this->repayment->creditRequest;

        return [
            'repayment_id' => $this->repayment->id,
            'credit_request_id' => $creditRequest->id,
            'code' => $creditRequest->code,
            'student_name' => $creditRequest->student->first_name.' '.$creditRequest->student->last_name,
            'amount' => $this->repayment->amount,
            'message' => 'Un recouvrement de '.$this->repayment->amount.' XOF a été saisi pour le dossier '.$creditRequest->code.'.',
            'url' => route('credit.recovery.index'),
        ];
    }
}

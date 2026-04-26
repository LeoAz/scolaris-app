<?php

namespace App\Notifications;

use App\Models\LoanTerminationRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LoanTerminationRequestedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public LoanTerminationRequest $request)
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
        $loanCode = $this->request->creditRequest->code;

        return (new MailMessage)
            ->subject("Nouvelle demande de résiliation - Prêt {$loanCode}")
            ->line("Une nouvelle demande de résiliation a été soumise pour le prêt {$loanCode}.")
            ->line("Motif : {$this->request->reason}")
            ->line("Date demandée : {$this->request->requested_date->format('d/m/Y')}")
            ->action('Voir la demande', url("/credit-requests/{$this->request->credit_request_id}/termination"))
            ->line('Merci d\'examiner cette demande dès que possible.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'loan_termination_request_id' => $this->request->id,
            'credit_request_id' => $this->request->credit_request_id,
            'loan_code' => $this->request->creditRequest->code,
            'reason' => $this->request->reason,
            'message' => "Nouvelle demande de résiliation pour le prêt {$this->request->creditRequest->code}",
        ];
    }
}

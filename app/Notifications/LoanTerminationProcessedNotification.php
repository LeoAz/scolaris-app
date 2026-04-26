<?php

namespace App\Notifications;

use App\Models\LoanTerminationRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LoanTerminationProcessedNotification extends Notification implements ShouldQueue
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
        $statusLabel = $this->request->status === 'approved' ? 'approuvée' : 'rejetée';
        $subject = "Votre demande de résiliation a été {$statusLabel} - Prêt {$loanCode}";

        $message = (new MailMessage)
            ->subject($subject)
            ->line("Votre demande de résiliation pour le prêt {$loanCode} a été {$statusLabel}.")
            ->line("Décision prise le : {$this->request->processed_at->format('d/m/Y')}");

        if ($this->request->status === 'rejected') {
            $message->line("Motif du rejet : {$this->request->rejection_reason}");
        } else {
            $message->line("Le statut de votre dossier a été mis à jour.");
        }

        return $message
            ->action('Voir la demande', url("/credit/termination-requests/{$this->request->id}"))
            ->line('Merci d\'utiliser notre plateforme.');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        $statusLabel = $this->request->status === 'approved' ? 'approuvée' : 'rejetée';

        return [
            'loan_termination_request_id' => $this->request->id,
            'credit_request_id' => $this->request->credit_request_id,
            'loan_code' => $this->request->creditRequest->code,
            'status' => $this->request->status,
            'message' => "Votre demande de résiliation pour le prêt {$this->request->creditRequest->code} a été {$statusLabel}.",
        ];
    }
}

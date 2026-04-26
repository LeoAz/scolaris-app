<?php

namespace App\Notifications;

use App\Models\CreditRequestInstallment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InstallmentReminder extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public CreditRequestInstallment $installment,
        public string $recipientType,
        public bool $isOverdue = false,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $creditRequest = $this->installment->creditRequest;
        $student = $creditRequest->student;
        $dueDate = $this->installment->due_date->translatedFormat('d F Y');
        $amount = number_format($this->installment->total_amount, 0, ',', ' ');
        $studentName = $student->first_name.' '.$student->last_name;

        if ($this->isOverdue) {
            return $this->overdueMessage($notifiable, $studentName, $dueDate, $amount);
        }

        return $this->upcomingMessage($notifiable, $studentName, $dueDate, $amount);
    }

    private function upcomingMessage(object $notifiable, string $studentName, string $dueDate, string $amount): MailMessage
    {
        $greeting = $this->recipientType === 'student'
            ? "Cher(e) {$studentName}"
            : "Cher(e) garant(e) de {$studentName}";

        $message = (new MailMessage)
            ->subject('Rappel : Échéance de paiement à venir')
            ->greeting($greeting.',')
            ->line('Nous espérons que vous vous portez bien.')
            ->line("Nous souhaitons vous rappeler qu'une échéance de paiement est prévue pour le **{$dueDate}**.")
            ->line("**Montant à régler :** {$amount} FCFA")
            ->line("**Échéance n°{$this->installment->installment_number}**")
            ->line('Nous vous invitons à effectuer le règlement avant la date indiquée afin d\'éviter tout désagrément.');

        if ($this->recipientType === 'guarantor') {
            $message->line("En tant que garant(e) de {$studentName}, nous vous prions de bien vouloir vous assurer que ce paiement sera effectué dans les délais.");
        }

        return $message
            ->line('Nous vous remercions pour votre confiance et restons à votre disposition pour toute question.')
            ->salutation('Cordialement, L\'équipe Scolaris');
    }

    private function overdueMessage(object $notifiable, string $studentName, string $dueDate, string $amount): MailMessage
    {
        $greeting = $this->recipientType === 'student'
            ? "Cher(e) {$studentName}"
            : "Cher(e) garant(e) de {$studentName}";

        $message = (new MailMessage)
            ->subject('Rappel : Échéance de paiement dépassée')
            ->greeting($greeting.',')
            ->line('Nous espérons que vous vous portez bien.')
            ->line("Nous souhaitons porter à votre attention que l'échéance de paiement du **{$dueDate}** n'a pas encore été réglée.")
            ->line("**Montant dû :** {$amount} FCFA")
            ->line("**Échéance n°{$this->installment->installment_number}**")
            ->line('Nous comprenons que des imprévus peuvent survenir. Cependant, nous vous serions reconnaissants de bien vouloir régulariser cette situation dans les meilleurs délais.');

        if ($this->recipientType === 'guarantor') {
            $message->line("En tant que garant(e) de {$studentName}, nous comptons sur votre soutien pour faciliter le règlement de cette échéance.");
        }

        return $message
            ->line('N\'hésitez pas à nous contacter si vous rencontrez des difficultés. Nous sommes là pour vous accompagner.')
            ->salutation('Cordialement, L\'équipe Scolaris');
    }
}

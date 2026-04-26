<?php

namespace App\Console\Commands;

use App\Models\CreditRequestInstallment;
use App\Notifications\InstallmentReminder;
use Carbon\CarbonInterface;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Notification;

class SendInstallmentReminders extends Command
{
    protected $signature = 'installments:send-reminders';

    protected $description = 'Envoie des rappels par mail aux étudiants et garants pour les échéances à venir ou en retard';

    public function handle(): int
    {
        $today = now()->startOfDay();

        $installments = CreditRequestInstallment::query()
            ->where('status', 'pending')
            ->whereBetween('due_date', [$today->copy()->subDays(14), $today->copy()->addDays(5)->endOfDay()])
            ->with(['creditRequest.student', 'creditRequest.guarantor'])
            ->get();

        $sent = 0;

        foreach ($installments as $installment) {
            if (! $this->shouldSendToday($installment->due_date, $today)) {
                continue;
            }

            $creditRequest = $installment->creditRequest;
            $isOverdue = $today->greaterThan($installment->due_date);

            // Notify student
            $student = $creditRequest->student;
            if ($student?->email) {
                Notification::route('mail', $student->email)
                    ->notify(new InstallmentReminder($installment, 'student', $isOverdue));
                $sent++;
            }

            // Notify guarantor
            $guarantor = $creditRequest->guarantor;
            if ($guarantor?->email) {
                Notification::route('mail', $guarantor->email)
                    ->notify(new InstallmentReminder($installment, 'guarantor', $isOverdue));
                $sent++;
            }
        }

        $this->info("{$sent} rappel(s) envoyé(s).");

        return self::SUCCESS;
    }

    /**
     * Détermine si un rappel doit être envoyé aujourd'hui pour une échéance donnée.
     *
     * - 5 jours avant : premier rappel
     * - Tous les 2 jours jusqu'à la date d'échéance (J-5, J-3, J-1)
     * - Le jour de l'échéance
     * - Après l'échéance : tous les 2 jours pendant 2 semaines (J+2, J+4, ..., J+14)
     */
    private function shouldSendToday(CarbonInterface $dueDate, CarbonInterface $today): bool
    {
        $diff = (int) $today->startOfDay()->diffInDays($dueDate->startOfDay(), false);

        // Avant l'échéance : J-5, J-3, J-1
        if ($diff > 0 && $diff <= 5 && $diff % 2 === 1) {
            return true;
        }

        // Le jour même
        if ($diff === 0) {
            return true;
        }

        // Après l'échéance : tous les 2 jours pendant 14 jours
        if ($diff < 0 && $diff >= -14 && abs($diff) % 2 === 0) {
            return true;
        }

        return false;
    }
}

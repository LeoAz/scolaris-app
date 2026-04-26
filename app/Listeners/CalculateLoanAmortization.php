<?php

namespace App\Listeners;

use App\Events\LoanValidated;
use App\Models\CreditRequestInstallment;
use Illuminate\Support\Carbon;

class CalculateLoanAmortization
{
    /**
     * Handle the event.
     */
    public function handle(LoanValidated $event): void
    {
        $creditRequest = $event->creditRequest;

        // Éviter le double calcul si les échéances existent déjà
        if ($creditRequest->installments()->exists()) {
            return;
        }

        $creditType = $creditRequest->creditType;

        $principal = (float) $creditRequest->amount_requested;
        $monthlyRate = (float) $creditType->rate / 100;
        $duration = (int) $creditType->duration_months;

        // On part du principe que la première mensualité est un mois après la validation (ou une date de début si définie)
        $startDate = $creditRequest->validated_at ?? now();
        $dueDate = Carbon::parse($startDate)->addMonth();

        $remainingPrincipal = $principal;

        // Taux mensuel dégressif : La mensualité totale peut varier ou être constante.
        // Généralement, on utilise l'annuité constante pour un prêt classique.
        // M = P * r / (1 - (1 + r)^-n)
        if ($monthlyRate > 0) {
            $monthlyPayment = ($principal * $monthlyRate) / (1 - pow(1 + $monthlyRate, -$duration));
        } else {
            $monthlyPayment = $principal / $duration;
        }

        for ($i = 1; $i <= $duration; $i++) {
            $interestAmount = $remainingPrincipal * $monthlyRate;
            $principalAmount = $monthlyPayment - $interestAmount;

            // Ajustement pour la dernière mensualité pour éviter les écarts d'arrondi
            if ($i === $duration) {
                $principalAmount = $remainingPrincipal;
                $monthlyPayment = $principalAmount + $interestAmount;
            }

            $currentRemainingPrincipal = $remainingPrincipal;
            $remainingPrincipalAfter = $remainingPrincipal - $principalAmount;

            CreditRequestInstallment::create([
                'credit_request_id' => $creditRequest->id,
                'installment_number' => $i,
                'due_date' => $dueDate->copy(),
                'principal_amount' => round($principalAmount, 2),
                'interest_amount' => round($interestAmount, 2),
                'total_amount' => round($monthlyPayment, 2),
                'remaining_principal' => round($currentRemainingPrincipal, 2),
                'status' => 'pending',
            ]);

            $remainingPrincipal = $remainingPrincipalAfter;
            $dueDate->addMonth();
        }
    }
}

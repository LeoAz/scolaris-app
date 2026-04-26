<?php

namespace App\Http\Controllers\Credit;

use App\Http\Controllers\Controller;
use App\Models\CreditRequestInstallment;
use App\Models\CreditRequestRepayment;
use App\Models\User;
use App\Notifications\RecoveryRecorded;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;
use Inertia\Response;

class RecoveryController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $allowedCreditTypeIds = null;
        if (! $user->hasFullAccessToCredits()) {
            $allowedCreditTypeIds = $user->creditTypes()->pluck('credit_types.id');
        }

        $installmentsQuery = CreditRequestInstallment::with(['creditRequest.student', 'creditRequest.creditType'])
            ->where('status', 'pending')
            ->where('due_date', '<=', now()->addDays(30));

        if ($allowedCreditTypeIds) {
            $installmentsQuery->whereHas('creditRequest', function ($q) use ($allowedCreditTypeIds) {
                $q->whereIn('credit_type_id', $allowedCreditTypeIds);
            });
        }

        $installments = $installmentsQuery->orderBy('due_date')
            ->get()
            ->map(function ($installment) {
                return [
                    'id' => $installment->id,
                    'installment_number' => $installment->installment_number,
                    'due_date' => $installment->due_date->format('Y-m-d'),
                    'total_amount' => $installment->total_amount,
                    'status' => $installment->status,
                    'credit_request' => [
                        'id' => $installment->creditRequest->id,
                        'code' => $installment->creditRequest->code,
                        'student' => [
                            'first_name' => $installment->creditRequest->student->first_name,
                            'last_name' => $installment->creditRequest->student->last_name,
                        ],
                        'credit_type' => [
                            'name' => $installment->creditRequest->creditType->name,
                        ],
                    ],
                ];
            });

        $pendingRepaymentsQuery = CreditRequestRepayment::with(['creditRequest.student', 'installment'])
            ->where('status', 'pending');

        if ($allowedCreditTypeIds) {
            $pendingRepaymentsQuery->whereHas('creditRequest', function ($q) use ($allowedCreditTypeIds) {
                $q->whereIn('credit_type_id', $allowedCreditTypeIds);
            });
        }

        $pendingRepayments = $pendingRepaymentsQuery->orderBy('repayment_date')
            ->get()
            ->map(function ($repayment) {
                return [
                    'id' => $repayment->id,
                    'amount' => $repayment->amount,
                    'repayment_date' => $repayment->repayment_date->format('Y-m-d'),
                    'payment_method' => $repayment->payment_method,
                    'reference' => $repayment->reference,
                    'status' => $repayment->status,
                    'proof_url' => $repayment->getFirstMediaUrl('proof_of_payment'),
                    'credit_request' => [
                        'id' => $repayment->creditRequest->id,
                        'code' => $repayment->creditRequest->code,
                        'student' => [
                            'first_name' => $repayment->creditRequest->student->first_name,
                            'last_name' => $repayment->creditRequest->student->last_name,
                        ],
                    ],
                    'installment' => [
                        'id' => $repayment->installment->id,
                        'installment_number' => $repayment->installment->installment_number,
                    ],
                ];
            });

        return Inertia::render('credit/recovery', [
            'installments' => $installments,
            'pendingRepayments' => $pendingRepayments,
            'breadcrumbs' => [
                ['title' => 'Tableau de bord', 'href' => route('dashboard')],
                ['title' => 'Gestion des recouvrements', 'href' => route('credit.recovery.index')],
            ],
        ]);
    }

    public function record(Request $request, CreditRequestInstallment $installment): RedirectResponse
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:1',
            'repayment_date' => 'required|date',
            'payment_method' => 'required|string',
            'reference' => 'nullable|string',
            'notes' => 'nullable|string',
            'proof' => 'required|file|mimes:jpeg,png,jpg,pdf|max:2048',
        ]);

        $repaymentData = collect($validated)->except('proof')->toArray();
        $repayment = new CreditRequestRepayment($repaymentData);
        $repayment->credit_request_id = $installment->credit_request_id;
        $repayment->installment_id = $installment->id;
        $repayment->status = 'pending';
        $repayment->save();

        if ($request->hasFile('proof')) {
            $repayment->addMediaFromRequest('proof')->toMediaCollection('proof_of_payment');
        }

        $repayment->load('creditRequest.student');
        $countryId = $repayment->creditRequest->country_id;

        $recipients = User::role(['Administrateur', 'Super admin', 'Controlleur (Dossier)'])
            ->whereHas('countries', fn ($q) => $q->where('countries.id', $countryId))
            ->get();

        Notification::send($recipients, new RecoveryRecorded($repayment));

        return back()->with('success', 'Recouvrement enregistré avec succès et en attente de validation.');
    }

    public function validateRepayment(CreditRequestRepayment $repayment): RedirectResponse
    {
        $repayment->update([
            'status' => 'validated',
            'validated_at' => now(),
            'validated_by_id' => auth()->id(),
        ]);

        // Check if installment is fully paid
        $installment = $repayment->installment;
        $totalRepaid = $installment->repayments()->where('status', 'validated')->sum('amount');

        if ($totalRepaid >= $installment->total_amount) {
            $installment->update(['status' => 'paid']);
        }

        return back()->with('success', 'Recouvrement validé avec succès.');
    }

    public function rejectRepayment(Request $request, CreditRequestRepayment $repayment): RedirectResponse
    {
        $repayment->update([
            'status' => 'rejected',
        ]);

        return back()->with('success', 'Recouvrement rejeté.');
    }
}

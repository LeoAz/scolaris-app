<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        // 1. Évolution du nombre de dossiers de prêt par pays (sur les 6 derniers mois)
        $requestsByCountry = DB::table('credit_requests')
            ->join('countries', 'credit_requests.country_id', '=', 'countries.id')
            ->select(
                'countries.name as country',
                DB::raw("DATE_FORMAT(credit_requests.created_at, '%Y-%m') as month"),
                DB::raw('count(*) as count')
            )
            ->where('credit_requests.created_at', '>=', Carbon::now()->subMonths(6))
            ->groupBy('country', 'month')
            ->orderBy('month')
            ->get();

        // 2. Évolution des validations par pays par rapport au nombre de dossiers soumis
        $statsByCountry = DB::table('credit_requests')
            ->join('countries', 'credit_requests.country_id', '=', 'countries.id')
            ->select(
                'countries.name as country',
                DB::raw("DATE_FORMAT(credit_requests.created_at, '%Y-%m') as month"),
                DB::raw('count(*) as total'),
                DB::raw('count(validated_at) as validated')
            )
            ->where('credit_requests.created_at', '>=', Carbon::now()->subMonths(6))
            ->groupBy('country', 'month')
            ->orderBy('month')
            ->get();

        // 3. Situation détaillée des dossiers
        $query = DB::table('credit_requests')
            ->join('countries', 'credit_requests.country_id', '=', 'countries.id')
            ->join('stakeholders', 'credit_requests.student_id', '=', 'stakeholders.id')
            ->leftJoin('credit_request_repayments', function ($join) {
                $join->on('credit_requests.id', '=', 'credit_request_repayments.credit_request_id')
                    ->where('credit_request_repayments.status', '=', 'validated');
            })
            ->select(
                'credit_requests.id',
                'credit_requests.code',
                DB::raw("CONCAT(stakeholders.first_name, ' ', stakeholders.last_name) as student_name"),
                'countries.name as country',
                'credit_requests.initial_contribution',
                'credit_requests.amount_requested as amount',
                DB::raw('COALESCE(SUM(credit_request_repayments.amount), 0) as total_repaid')
            )
            ->groupBy(
                'credit_requests.id',
                'credit_requests.code',
                'student_name',
                'country',
                'credit_requests.initial_contribution',
                'credit_requests.amount_requested'
            );

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('credit_requests.code', 'like', "%{$search}%")
                    ->orWhere('stakeholders.first_name', 'like', "%{$search}%")
                    ->orWhere('stakeholders.last_name', 'like', "%{$search}%");
            });
        }

        if ($request->has('country') && $request->input('country') !== 'all') {
            $query->where('countries.name', $request->input('country'));
        }

        $loanDetails = $query->paginate(10)
            ->through(function ($loan) {
                $loan->remaining = $loan->amount - $loan->total_repaid;

                return $loan;
            });

        return Inertia::render('dashboard', [
            'requestsByCountry' => $requestsByCountry,
            'statsByCountry' => $statsByCountry,
            'loanDetails' => $loanDetails,
            'countries' => DB::table('countries')->orderBy('name')->pluck('name'),
            'filters' => $request->only(['search', 'country']),
            'breadcrumbs' => [
                ['title' => 'Tableau de bord', 'href' => route('dashboard')],
            ],
        ]);
    }
}

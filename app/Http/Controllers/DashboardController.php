<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class DashboardController extends Controller
{
    public function export(Request $request)
    {
        $query = DB::table('credit_requests')
            ->join('countries', 'credit_requests.country_id', '=', 'countries.id')
            ->join('stakeholders', 'credit_requests.student_id', '=', 'stakeholders.id')
            ->leftJoin('credit_request_repayments', function ($join) {
                $join->on('credit_requests.id', '=', 'credit_request_repayments.credit_request_id')
                    ->where('credit_request_repayments.status', '=', 'validated');
            })
            ->select(
                'credit_requests.code',
                DB::raw("CONCAT(stakeholders.first_name, ' ', stakeholders.last_name) as student_name"),
                'countries.name as country',
                'credit_requests.initial_contribution',
                'credit_requests.amount_requested as amount',
                'credit_requests.insurance_amount',
                'credit_requests.processing_fees_variable',
                'credit_requests.processing_fees_fixed',
                'credit_requests.first_month_interest',
                DB::raw('COALESCE(SUM(credit_request_repayments.amount), 0) as total_repaid')
            )
            ->groupBy(
                'credit_requests.id',
                'credit_requests.code',
                'student_name',
                'country',
                'credit_requests.initial_contribution',
                'credit_requests.amount_requested',
                'credit_requests.insurance_amount',
                'credit_requests.processing_fees_variable',
                'credit_requests.processing_fees_fixed',
                'credit_requests.first_month_interest'
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

        $loans = $query->get()->map(function ($loan) {
            $loan->total_fees = (float) $loan->insurance_amount +
                               (float) $loan->processing_fees_variable +
                               (float) $loan->processing_fees_fixed +
                               (float) $loan->first_month_interest;
            $loan->remaining = $loan->amount - $loan->total_repaid;

            return $loan;
        });

        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Situation des dossiers');

        $headers = ['Code Dossier', 'Étudiant', 'Pays', 'Frais de dossier', 'Apport Initial', 'Montant Prêt', 'Total Remboursé', 'Solde Restant'];
        foreach ($headers as $index => $header) {
            $column = chr(65 + $index);
            $sheet->setCellValue($column.'1', $header);
        }

        $headerStyle = [
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 12],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '1E40AF']], // Blue-800
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_MEDIUM]],
        ];
        $sheet->getStyle('A1:H1')->applyFromArray($headerStyle);
        $sheet->getRowDimension(1)->setRowHeight(30);

        $row = 2;
        foreach ($loans as $loan) {
            $sheet->setCellValue('A'.$row, $loan->code);
            $sheet->setCellValue('B'.$row, $loan->student_name);
            $sheet->setCellValue('C'.$row, $loan->country);
            $sheet->setCellValue('D'.$row, $loan->total_fees);
            $sheet->setCellValue('E'.$row, $loan->initial_contribution);
            $sheet->setCellValue('F'.$row, $loan->amount);
            $sheet->setCellValue('G'.$row, $loan->total_repaid);
            $sheet->setCellValue('H'.$row, $loan->remaining);

            // Format monétaire pour les colonnes D à H
            $sheet->getStyle('D'.$row.':H'.$row)->getNumberFormat()->setFormatCode('#,##0 "FCFA"');

            // Couleurs conditionnelles pour le solde restant
            if ($loan->remaining > 0) {
                $sheet->getStyle('H'.$row)->getFont()->getColor()->setRGB('DC2626'); // Red-600
            } else {
                $sheet->getStyle('H'.$row)->getFont()->getColor()->setRGB('16A34A'); // Green-600
            }

            $row++;
        }

        $lastRow = $row - 1;
        $sheet->getStyle('A1:H'.$lastRow)->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
        $sheet->getStyle('A2:C'.$lastRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
        $sheet->getStyle('D2:H'.$lastRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);

        foreach (range('A', 'H') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        $fileName = 'situation_dossiers_'.now()->format('Y-m-d_H-i').'.xlsx';

        return response()->streamDownload(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, $fileName, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="'.$fileName.'"',
        ]);
    }

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
                'credit_requests.insurance_amount',
                'credit_requests.processing_fees_variable',
                'credit_requests.processing_fees_fixed',
                'credit_requests.first_month_interest',
                DB::raw('COALESCE(SUM(credit_request_repayments.amount), 0) as total_repaid')
            )
            ->groupBy(
                'credit_requests.id',
                'credit_requests.code',
                'student_name',
                'country',
                'credit_requests.initial_contribution',
                'credit_requests.amount_requested',
                'credit_requests.insurance_amount',
                'credit_requests.processing_fees_variable',
                'credit_requests.processing_fees_fixed',
                'credit_requests.first_month_interest'
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
                $loan->total_fees = (float) $loan->insurance_amount +
                                   (float) $loan->processing_fees_variable +
                                   (float) $loan->processing_fees_fixed +
                                   (float) $loan->first_month_interest;

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

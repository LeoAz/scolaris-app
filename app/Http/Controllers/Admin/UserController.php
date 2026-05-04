<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UserStoreRequest;
use App\Http\Requests\Admin\UserUpdateRequest;
use App\Models\Country;
use App\Models\CreditType;
use App\Models\User;
use App\Notifications\UserCreatedNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function export(Request $request)
    {
        $users = User::with(['roles', 'countries'])->get();

        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Utilisateurs');

        // En-têtes
        $headers = ['Nom', 'Email', 'Pseudo', 'Rôle(s)', 'Pays', 'Mot de passe'];
        foreach ($headers as $index => $header) {
            $column = chr(65 + $index);
            $sheet->setCellValue($column.'1', $header);
        }

        // Style des en-têtes
        $headerStyle = [
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '4F46E5'], // Indigo-600
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                ],
            ],
        ];
        $sheet->getStyle('A1:F1')->applyFromArray($headerStyle);

        // Données
        $row = 2;
        foreach ($users as $user) {
            $sheet->setCellValue('A'.$row, $user->name);
            $sheet->setCellValue('B'.$row, $user->email);
            $sheet->setCellValue('C'.$row, $user->username);
            $sheet->setCellValue('D'.$row, $user->roles->pluck('name')->implode(', '));
            $sheet->setCellValue('E'.$row, $user->countries->pluck('name')->implode(', '));
            $sheet->setCellValue('F'.$row, $user->password_plain ?? '********');
            $row++;
        }

        // Bordures pour le tableau
        $lastRow = $row - 1;
        $tableRange = 'A1:F'.$lastRow;
        $sheet->getStyle($tableRange)->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);

        // Ajustement automatique des colonnes
        foreach (range('A', 'F') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        $fileName = 'utilisateurs_'.now()->format('Y-m-d_H-i').'.xlsx';

        return response()->streamDownload(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, $fileName, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="'.$fileName.'"',
        ]);
    }

    public function index(Request $request)
    {
        $query = User::query()
            ->with(['roles', 'countries', 'creditTypes'])
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('username', 'like', "%{$search}%");
                });
            })
            ->when($request->country, function ($query, $countryId) {
                $query->whereHas('countries', function ($q) use ($countryId) {
                    $q->where('countries.id', $countryId);
                });
            });

        $users = $query->paginate(10)->withQueryString();

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'roles' => Role::all(['id', 'name', 'description']),
            'countries' => Country::all(['id', 'code', 'name']),
            'creditTypes' => CreditType::all(['id', 'name']),
            'filters' => $request->only(['search', 'country']),
        ]);
    }

    public function store(UserStoreRequest $request)
    {
        $validated = $request->validated();

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'username' => $validated['username'],
            'password' => Hash::make($validated['password']),
            'password_plain' => $validated['password'],
            'must_change_password' => true,
        ]);

        $user->assignRole(array_map('intval', $validated['roles']));
        $user->countries()->sync($validated['countries'] ?? []);
        $user->creditTypes()->sync($validated['credit_types'] ?? []);

        $user->notify(new UserCreatedNotification($validated['password']));

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Utilisateur créé avec succès.',
        ]);

        return back();
    }

    public function update(UserUpdateRequest $request, User $user)
    {
        $validated = $request->validated();

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'username' => $validated['username'],
        ]);

        if (! empty($validated['password'])) {
            $user->update([
                'password' => Hash::make($validated['password']),
                'password_plain' => $validated['password'],
            ]);
        }

        $user->syncRoles(array_map('intval', $validated['roles']));
        $user->countries()->sync($validated['countries'] ?? []);
        $user->creditTypes()->sync($validated['credit_types'] ?? []);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Utilisateur mis à jour avec succès.',
        ]);

        return back();
    }

    public function destroy(User $user)
    {
        $user->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Utilisateur supprimé avec succès.',
        ]);

        return back();
    }
}

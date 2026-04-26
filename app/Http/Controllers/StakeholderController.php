<?php

namespace App\Http\Controllers;

use App\Models\Stakeholder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StakeholderController extends Controller
{
    public function students(Request $request): Response
    {
        $search = $request->input('search');

        $students = Stakeholder::where('type', 'student')
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('whatsapp_number', 'like', "%{$search}%");
                });
            })
            ->with(['studentCreditRequests'])
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('stakeholders/index', [
            'stakeholders' => $students,
            'type' => 'student',
            'filters' => $request->only(['search']),
            'breadcrumbs' => [
                ['title' => 'Étudiants', 'href' => route('stakeholders.students')],
            ],
        ]);
    }

    public function guarantors(Request $request): Response
    {
        $search = $request->input('search');

        $guarantors = Stakeholder::where('type', 'guarantor')
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('whatsapp_number', 'like', "%{$search}%");
                });
            })
            ->with(['guarantorCreditRequests'])
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('stakeholders/index', [
            'stakeholders' => $guarantors,
            'type' => 'guarantor',
            'filters' => $request->only(['search']),
            'breadcrumbs' => [
                ['title' => 'Garants', 'href' => route('stakeholders.guarantors')],
            ],
        ]);
    }
}

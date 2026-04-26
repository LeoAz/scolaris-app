<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CreditTypeStoreRequest;
use App\Http\Requests\Admin\CreditTypeUpdateRequest;
use App\Models\CreditType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CreditTypeController extends Controller
{
    public function index(Request $request)
    {
        $query = CreditType::query()
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });

        $creditTypes = $query->paginate(10)->withQueryString();

        return Inertia::render('admin/credit-types/index', [
            'creditTypes' => $creditTypes,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(CreditTypeStoreRequest $request)
    {
        CreditType::create($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Type de prêt créé avec succès.',
        ]);

        return back();
    }

    public function update(CreditTypeUpdateRequest $request, CreditType $creditType)
    {
        $creditType->update($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Type de prêt mis à jour avec succès.',
        ]);

        return back();
    }

    public function destroy(CreditType $creditType)
    {
        $creditType->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Type de prêt supprimé avec succès.',
        ]);

        return back();
    }
}

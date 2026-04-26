<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CountryStoreRequest;
use App\Http\Requests\Admin\CountryUpdateRequest;
use App\Models\Country;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CountryController extends Controller
{
    public function index(Request $request)
    {
        $query = Country::query()
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });

        $countries = $query->paginate(10)->withQueryString();

        return Inertia::render('admin/countries/index', [
            'countries' => $countries,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(CountryStoreRequest $request)
    {
        Country::create($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Pays créé avec succès.',
        ]);

        return back();
    }

    public function update(CountryUpdateRequest $request, Country $country)
    {
        $country->update($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Pays mis à jour avec succès.',
        ]);

        return back();
    }

    public function destroy(Country $country)
    {
        $country->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Pays supprimé avec succès.',
        ]);

        return back();
    }
}

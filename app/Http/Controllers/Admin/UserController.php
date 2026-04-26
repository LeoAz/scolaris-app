<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UserStoreRequest;
use App\Http\Requests\Admin\UserUpdateRequest;
use App\Models\Country;
use App\Models\CreditType;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
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
        ]);

        $user->assignRole(array_map('intval', $validated['roles']));
        $user->countries()->sync($validated['countries'] ?? []);
        $user->creditTypes()->sync($validated['credit_types'] ?? []);

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
            $user->update(['password' => Hash::make($validated['password'])]);
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

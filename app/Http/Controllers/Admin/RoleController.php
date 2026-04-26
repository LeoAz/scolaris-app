<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\RoleStoreRequest;
use App\Http\Requests\Admin\RoleUpdateRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    public function index(Request $request)
    {
        $query = Role::query()
            ->with('permissions')
            ->select('roles.*')
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });

        $roles = $query->paginate(10)->withQueryString();

        return Inertia::render('admin/roles/index', [
            'roles' => $roles,
            'permissions' => Permission::all(['id', 'name', 'group', 'description']),
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(RoleStoreRequest $request)
    {
        $validated = $request->validated();

        $role = Role::create([
            'name' => $validated['name'],
            'description' => $validated['description'],
        ]);
        $role->syncPermissions($validated['permissions']);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Rôle créé avec succès.',
        ]);

        return back();
    }

    public function update(RoleUpdateRequest $request, Role $role)
    {
        $validated = $request->validated();

        $role->update([
            'name' => $validated['name'],
            'description' => $validated['description'],
        ]);
        $role->syncPermissions($validated['permissions']);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Rôle mis à jour avec succès.',
        ]);

        return back();
    }

    public function destroy(Role $role)
    {
        if ($role->name === 'Super admin') {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Le rôle Super admin ne peut pas être supprimé.',
            ]);

            return back();
        }

        $role->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Rôle supprimé avec succès.',
        ]);

        return back();
    }
}

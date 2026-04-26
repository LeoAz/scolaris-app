<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;

class PermissionController extends Controller
{
    public function index(Request $request)
    {
        $query = Permission::query()
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            });

        $permissions = $query->paginate(10)->withQueryString();

        return Inertia::render('admin/permissions/index', [
            'permissions' => $permissions,
            'filters' => $request->only(['search']),
        ]);
    }
}

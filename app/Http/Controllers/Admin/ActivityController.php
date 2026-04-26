<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ActivityController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->only(['search']);

        return Inertia::render('admin/activities/index', [
            'filters' => $filters,
        ]);
    }
}

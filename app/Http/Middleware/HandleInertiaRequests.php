<?php

namespace App\Http\Middleware;

use App\Enums\CreditRequestStatus;
use App\Models\CreditRequest;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return null;
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        $shared = [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user ? [
                    ...$user->toArray(),
                    'roles' => $user->roles->pluck('name'),
                    'permissions' => $user->getAllPermissions()->pluck('name'),
                    'unreadNotificationsCount' => $user->unreadNotifications()->count(),
                ] : null,
            ],
            'notifications' => [
                'list' => $user?->notifications()->latest()->limit(10)->get() ?? [],
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
        ];

        if ($request->is('credit*')) {
            $shared['credit'] = [
                'statusCounts' => collect(CreditRequestStatus::cases())->mapWithKeys(function ($status) {
                    return [$status->value => CreditRequest::where('status', $status->value)->count()];
                })->all(),
                'totalCount' => CreditRequest::count(),
            ];
        }

        return $shared;
    }
}

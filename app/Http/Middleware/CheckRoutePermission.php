<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Symfony\Component\HttpFoundation\Response;

class CheckRoutePermission
{
    /**
     * Les routes qui ne nécessitent pas de vérification de permission
     * au-delà de l'authentification.
     */
    protected array $excludedRoutes = [
        'home',
        'dashboard',
        'logout',
        'verification.notice',
        'verification.verify',
        'verification.send',
        'password.confirm',
        'profile.edit', // Optionnel : si on veut que tout le monde puisse modifier son profil
        'profile.update',
        'security.edit',
        'user-password.update',
    ];

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $routeName = $request->route()?->getName();

        if ($routeName && $request->user()) {
            // Exclure les routes de base
            if (in_array($routeName, $this->excludedRoutes)) {
                return $next($request);
            }

            // Vérifier si la permission existe dans la base de données
            $permissionExists = DB::table('permissions')->where('name', $routeName)->exists();

            if (! $permissionExists) {
                return $next($request);
            }

            if (! $request->user()->can($routeName)) {
                abort(403, 'Vous n\'avez pas la permission d\'accéder à cette ressource ('.$routeName.').');
            }
        }

        return $next($request);
    }
}

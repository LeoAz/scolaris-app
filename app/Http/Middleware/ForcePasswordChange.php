<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ForcePasswordChange
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (auth()->check() && auth()->user()->must_change_password && ! $request->routeIs('auth.password.force-change', 'auth.password.force-change.store', 'logout')) {
            return redirect()->route('auth.password.force-change');
        }

        return $next($request);
    }
}

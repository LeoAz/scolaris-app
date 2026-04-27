<?php

namespace App\Http\Responses;

use Illuminate\Http\Request;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Symfony\Component\HttpFoundation\Response;

class LoginResponse implements LoginResponseContract
{
    /**
     * @param  Request  $request
     * @return Response
     */
    public function toResponse($request)
    {
        $user = $request->user();

        if ($user->hasAnyRole(['Super admin', 'Administrateur', 'Super Administrateur'])) {
            return redirect()->intended(route('dashboard'));
        }

        return redirect()->intended(route('credit.index'));
    }
}

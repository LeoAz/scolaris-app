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
        // On force la redirection vers la liste des dossiers de crédit,
        // même s'il y avait une URL "intended" (prévue) en session,
        // car la consigne métier est que tout le monde arrive sur la liste des dossiers.
        return redirect()->route('credit.index');
    }
}

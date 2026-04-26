<?php

namespace App\Listeners;

use App\Models\Country;
use Illuminate\Auth\Events\Login;
use Illuminate\Http\Request;

class SetSelectedCountrySession
{
    /**
     * Create the event listener.
     */
    public function __construct(protected Request $request)
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(Login $event): void
    {
        $countryName = $this->request->input('country');

        if ($countryName) {
            $country = Country::where('name', $countryName)->first();

            if ($country) {
                session(['selected_country_id' => $country->id]);
            }
        }
    }
}

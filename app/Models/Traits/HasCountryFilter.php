<?php

namespace App\Models\Traits;

use App\Models\Scopes\CountryScope;

trait HasCountryFilter
{
    /**
     * Boot the HasCountryFilter trait for a model.
     */
    protected static function bootHasCountryFilter(): void
    {
        static::addGlobalScope(new CountryScope);
    }
}

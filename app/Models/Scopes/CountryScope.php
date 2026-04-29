<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;

class CountryScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
    {
        // Don't apply scope if we're in console (e.g. migrations, seeding)
        // EXCEPT if we are running tests
        if (app()->runningInConsole() && ! app()->runningUnitTests()) {
            return;
        }

        $user = Auth::user();

        // Skip for super admin and admin
        if ($user && ($user->hasRole('Super admin') || $user->hasRole('Administrateur'))) {
            return;
        }

        $countryId = session('selected_country_id');

        if ($countryId) {
            $table = $model->getTable();

            if ($table === 'stakeholders') {
                $builder->where(function ($query) use ($countryId) {
                    $query->whereIn('stakeholders.id', function ($sub) use ($countryId) {
                        $sub->select('student_id')
                            ->from('credit_requests')
                            ->where('country_id', $countryId);
                    })->orWhereIn('stakeholders.id', function ($sub) use ($countryId) {
                        $sub->select('guarantor_id')
                            ->from('credit_requests')
                            ->where('country_id', $countryId);
                    });
                });
            } elseif ($table === 'credit_request_repayments' || $table === 'credit_request_activities') {
                $builder->whereHas('creditRequest', function ($query) use ($countryId) {
                    $query->withoutGlobalScopes()->where('credit_requests.country_id', $countryId);
                });
            } elseif ($table === 'credit_requests') {
                $builder->where($table.'.country_id', $countryId);
            }
        }
    }
}

<?php

namespace App\Policies;

use App\Models\CreditRequest;
use App\Models\User;

class CreditRequestPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, CreditRequest $creditRequest): bool
    {
        return $user->canAccessCreditRequest($creditRequest);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, CreditRequest $creditRequest): bool
    {
        return $user->canAccessCreditRequest($creditRequest);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, CreditRequest $creditRequest): bool
    {
        return $user->hasFullAccessToCredits();
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, CreditRequest $creditRequest): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, CreditRequest $creditRequest): bool
    {
        return false;
    }
}

<?php

namespace App\Traits;

use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

trait NotifiesStakeholders
{
    /**
     * Obtenir les destinataires des notifications pour un dossier de crédit.
     * Inclut : Administrateurs, Super admins, Contrôleurs (pays) et Validateurs (pays).
     *
     * @param  int|null  $countryId  ID du pays lié au dossier
     * @return Collection<int, User>
     */
    public function getStakeholders(?int $countryId): Collection
    {
        // Administrateurs globaux
        $admins = User::role(['Administrateur', 'Super admin', 'Super Administrateur'])->get();

        if (! $countryId) {
            return $admins->unique('id');
        }

        // Contrôleurs et Validateurs liés au pays
        $localStakeholders = User::role(['Controlleur (Dossier)', 'Validateur'])
            ->whereHas('countries', function ($query) use ($countryId) {
                $query->where('countries.id', $countryId);
            })
            ->get();

        return $admins->concat($localStakeholders)->unique('id');
    }
}

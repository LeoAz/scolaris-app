<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Traits\HasRoles;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string $username
 * @property string|null $password
 * @property string|null $password_plain
 * @property Carbon|null $email_verified_at
 * @property Carbon|null $two_factor_confirmed_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 * @property-read Collection<int, Country> $countries
 * @property-read Collection<int, CreditType> $creditTypes
 * @property-read Collection<int, Role> $roles
 * @property-read Collection<int, Permission> $permissions
 */
#[Fillable(['name', 'email', 'username', 'password', 'password_plain', 'must_change_password'])]
#[Hidden(['password', 'password_plain', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasRoles, Notifiable, SoftDeletes, TwoFactorAuthenticatable;

    /**
     * @return BelongsToMany<Country, $this>
     */
    public function countries(): BelongsToMany
    {
        return $this->belongsToMany(Country::class);
    }

    /**
     * @return BelongsToMany<CreditType, $this>
     */
    public function creditTypes(): BelongsToMany
    {
        return $this->belongsToMany(CreditType::class)->withTimestamps();
    }

    public function hasFullAccessToCredits(): bool
    {
        return $this->hasAnyRole(['Super admin', 'Administrateur', 'Super Administrateur', 'Validateur']);
    }

    public function canAccessCreditRequest(CreditRequest $creditRequest): bool
    {
        if ($this->hasFullAccessToCredits()) {
            return true;
        }

        $hasTypeAccess = $this->creditTypes()->where('credit_types.id', $creditRequest->credit_type_id)->exists();
        $hasCountryAccess = $this->countries()->where('countries.id', $creditRequest->country_id)->exists();

        return $hasTypeAccess && $hasCountryAccess;
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'must_change_password' => 'boolean',
        ];
    }
}

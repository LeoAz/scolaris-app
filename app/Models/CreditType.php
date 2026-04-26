<?php

namespace App\Models;

use Database\Factories\CreditTypeFactory;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string|null $description
 * @property float $rate
 * @property int $duration_months
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 * @property-read Collection<int, CreditRequest> $creditRequests
 * @property-read Collection<int, User> $users
 */
class CreditType extends Model
{
    /** @use HasFactory<CreditTypeFactory> */
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'rate',
        'duration_months',
        'searchable',
    ];

    protected $casts = [
        'rate' => 'decimal:2',
        'duration_months' => 'integer',
    ];

    public function creditRequests(): HasMany
    {
        return $this->hasMany(CreditRequest::class);
    }

    /**
     * @return BelongsToMany<User, $this>
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->withTimestamps();
    }
}

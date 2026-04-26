<?php

namespace App\Models;

use App\Models\Traits\HasCountryFilter;
use Database\Factories\StakeholderFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Stakeholder extends Model implements HasMedia
{
    /** @use HasFactory<StakeholderFactory> */
    use HasCountryFilter, HasFactory, InteractsWithMedia, SoftDeletes;

    protected $fillable = [
        'type',
        'student_id',
        'last_name',
        'first_name',
        'email',
        'whatsapp_number',
        'other_number',
        'address',
        'profession',
        'amplitude_account',
        'id_card_number',
        'id_card_type',
        'searchable',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Stakeholder::class, 'student_id');
    }

    public function guarantors(): HasMany
    {
        return $this->hasMany(Stakeholder::class, 'student_id');
    }

    public function studentCreditRequests(): HasMany
    {
        return $this->hasMany(CreditRequest::class, 'student_id');
    }

    public function guarantorCreditRequests(): HasMany
    {
        return $this->hasMany(CreditRequest::class, 'guarantor_id');
    }

    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }
}

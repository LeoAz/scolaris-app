<?php

namespace App\Models;

use App\Models\Traits\HasCountryFilter;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class CreditRequestRepayment extends Model implements HasMedia
{
    use HasCountryFilter, HasFactory, InteractsWithMedia;

    protected $fillable = [
        'credit_request_id',
        'installment_id',
        'amount',
        'repayment_date',
        'payment_method',
        'reference',
        'notes',
        'status',
        'validated_at',
        'validated_by_id',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'repayment_date' => 'date',
        'validated_at' => 'datetime',
    ];

    public function validatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'validated_by_id');
    }

    public function creditRequest(): BelongsTo
    {
        return $this->belongsTo(CreditRequest::class);
    }

    public function installment(): BelongsTo
    {
        return $this->belongsTo(CreditRequestInstallment::class, 'installment_id');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LoanTerminationRequest extends Model
{
    /** @use HasFactory<\Database\Factories\LoanTerminationRequestFactory> */
    use HasFactory;

    protected $fillable = [
        'credit_request_id',
        'user_id',
        'requested_date',
        'reason',
        'description',
        'status',
        'processed_by_id',
        'processed_at',
        'rejection_reason',
    ];

    protected $casts = [
        'requested_date' => 'date',
        'processed_at' => 'datetime',
    ];

    public function creditRequest()
    {
        return $this->belongsTo(CreditRequest::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function processedBy()
    {
        return $this->belongsTo(User::class, 'processed_by_id');
    }
}

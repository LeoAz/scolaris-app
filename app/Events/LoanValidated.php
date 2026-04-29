<?php

namespace App\Events;

use App\Models\CreditRequest;
use Illuminate\Foundation\Events\Dispatchable;

class LoanValidated
{
    use Dispatchable;

    public function __construct(
        public CreditRequest $creditRequest,
        public ?int $userId = null,
    ) {}
}

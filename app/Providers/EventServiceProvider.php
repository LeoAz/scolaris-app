<?php

namespace App\Providers;

use App\Events\LoanValidated;
use App\Listeners\CalculateLoanAmortization;
use App\Listeners\GenerateLoanContractListener;
use App\Listeners\SendLoanValidatedNotifications;
use App\Listeners\SetSelectedCountrySession;
use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        Event::listen(
            LoanValidated::class,
            CalculateLoanAmortization::class
        );

        Event::listen(
            LoanValidated::class,
            SendLoanValidatedNotifications::class
        );

        Event::listen(
            LoanValidated::class,
            GenerateLoanContractListener::class
        );

        Event::listen(
            Login::class,
            SetSelectedCountrySession::class
        );
    }
}

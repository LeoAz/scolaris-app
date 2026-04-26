<?php

use App\Http\Controllers\Admin\ActivityController;
use App\Http\Controllers\Admin\CountryController;
use App\Http\Controllers\Admin\CreditTypeController;
use App\Http\Controllers\Admin\PermissionController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Credit\CreditRequestController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\LoanTerminationRequestController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\StakeholderController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return redirect()->route('dashboard');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');


    Route::prefix('admin')->name('admin.')->group(function () {
        Route::get('users', [UserController::class, 'index'])->name('users.index');
        Route::post('users', [UserController::class, 'store'])->name('users.store');
        Route::put('users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy');

        Route::get('roles', [RoleController::class, 'index'])->name('roles.index');
        Route::post('roles', [RoleController::class, 'store'])->name('roles.store');
        Route::put('roles/{role}', [RoleController::class, 'update'])->name('roles.update');
        Route::delete('roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy');
        Route::get('permissions', [PermissionController::class, 'index'])->name('permissions.index');
        Route::get('activities', [ActivityController::class, 'index'])->name('activities.index');
        Route::get('countries', [CountryController::class, 'index'])->name('countries.index');
        Route::post('countries', [CountryController::class, 'store'])->name('countries.store');
        Route::put('countries/{country}', [CountryController::class, 'update'])->name('countries.update');
        Route::delete('countries/{country}', [CountryController::class, 'destroy'])->name('countries.destroy');

        Route::get('credit-types', [CreditTypeController::class, 'index'])->name('credit-types.index');
        Route::post('credit-types', [CreditTypeController::class, 'store'])->name('credit-types.store');
        Route::put('credit-types/{creditType}', [CreditTypeController::class, 'update'])->name('credit-types.update');
        Route::delete('credit-types/{creditType}', [CreditTypeController::class, 'destroy'])->name('credit-types.destroy');
    });

    Route::prefix('credit')->name('credit.')->group(function () {
        Route::get('requests', [CreditRequestController::class, 'index'])->name('index');
        Route::get('requests/create', [CreditRequestController::class, 'create'])->name('create');
        Route::post('requests', [CreditRequestController::class, 'store'])->name('store');
        Route::get('requests/{creditRequest}', [CreditRequestController::class, 'show'])->name('show');
        Route::get('requests/{creditRequest}/edit', [CreditRequestController::class, 'edit'])->name('edit');
        Route::get('guarantors/search', [CreditRequestController::class, 'searchGuarantor'])->name('guarantors.search');
        Route::put('requests/{creditRequest}', [CreditRequestController::class, 'update'])->name('update');
        Route::delete('requests/{creditRequest}', [CreditRequestController::class, 'destroy'])->name('destroy');
        Route::post('requests/{creditRequest}/submit', [CreditRequestController::class, 'submit'])->name('submit');
        Route::post('requests/{creditRequest}/validate-request', [CreditRequestController::class, 'validateRequest'])->name('validate');
        Route::post('requests/{creditRequest}/reject', [CreditRequestController::class, 'rejectRequest'])->name('reject');
        Route::post('requests/{creditRequest}/resiliate', [CreditRequestController::class, 'resiliate'])->name('resiliate');

        Route::get('termination-requests', [LoanTerminationRequestController::class, 'index'])->name('termination-requests.index');
        Route::get('requests/{creditRequest}/termination/create', [LoanTerminationRequestController::class, 'create'])->name('termination-requests.create');
        Route::post('requests/{creditRequest}/termination', [LoanTerminationRequestController::class, 'store'])->name('termination-requests.store');
        Route::get('termination-requests/{loanTerminationRequest}', [LoanTerminationRequestController::class, 'show'])->name('termination-requests.show');
        Route::post('termination-requests/{loanTerminationRequest}/approve', [LoanTerminationRequestController::class, 'approve'])->name('termination-requests.approve');
        Route::post('termination-requests/{loanTerminationRequest}/reject', [LoanTerminationRequestController::class, 'reject'])->name('termination-requests.reject');

        Route::post('requests/{creditRequest}/documents', [CreditRequestController::class, 'uploadDocument'])->name('documents.upload');
        Route::delete('requests/{creditRequest}/documents/{media}', [CreditRequestController::class, 'deleteDocument'])->name('documents.delete');

        Route::get('requests/{creditRequest}/installments', [CreditRequestController::class, 'installments'])->name('installments.index');
        Route::get('requests/{creditRequest}/summary', [CreditRequestController::class, 'summary'])->name('summary');
        Route::post('requests/{creditRequest}/installments/{installment}/repayments', [CreditRequestController::class, 'recordRepayment'])->name('installments.repayments.store');
        Route::post('requests/{creditRequest}/repayments/{repayment}/validate', [CreditRequestController::class, 'validateRepayment'])->name('installments.repayments.validate');
        Route::post('requests/{creditRequest}/repayments/{repayment}/reject', [CreditRequestController::class, 'rejectRepayment'])->name('installments.repayments.reject');

        Route::get('recovery', [\App\Http\Controllers\Credit\RecoveryController::class, 'index'])->name('recovery.index');
        Route::post('recovery/installments/{installment}/record', [\App\Http\Controllers\Credit\RecoveryController::class, 'record'])->name('recovery.record');
        Route::post('recovery/repayments/{repayment}/validate', [\App\Http\Controllers\Credit\RecoveryController::class, 'validateRepayment'])->name('recovery.validate');
        Route::post('recovery/repayments/{repayment}/reject', [\App\Http\Controllers\Credit\RecoveryController::class, 'rejectRepayment'])->name('recovery.reject');
    });

    Route::prefix('stakeholders')->name('stakeholders.')->group(function () {
        Route::get('students', [StakeholderController::class, 'students'])->name('students');
        Route::get('guarantors', [StakeholderController::class, 'guarantors'])->name('guarantors');
    });

    Route::prefix('notifications')->name('notifications.')->group(function () {
        Route::get('/', [NotificationController::class, 'index'])->name('index');
        Route::post('/{id}/mark-as-read', [NotificationController::class, 'markAsRead'])->name('mark-as-read');
        Route::post('/mark-all-as-read', [NotificationController::class, 'markAllAsRead'])->name('mark-all-as-read');
    });
});

require __DIR__.'/settings.php';

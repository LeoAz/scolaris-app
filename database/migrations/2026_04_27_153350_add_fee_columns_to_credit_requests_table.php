<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('credit_requests', function (Blueprint $table) {
            $table->decimal('insurance_amount', 15, 2)->nullable()->after('initial_contribution');
            $table->decimal('processing_fees_variable', 15, 2)->nullable()->after('insurance_amount');
            $table->decimal('processing_fees_fixed', 15, 2)->nullable()->after('processing_fees_variable');
            $table->decimal('first_month_interest', 15, 2)->nullable()->after('processing_fees_fixed');
            $table->decimal('total_microfinance_fees', 15, 2)->nullable()->after('first_month_interest');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('credit_requests', function (Blueprint $table) {
            $table->dropColumn([
                'insurance_amount',
                'processing_fees_variable',
                'processing_fees_fixed',
                'first_month_interest',
                'total_microfinance_fees',
            ]);
        });
    }
};

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
        Schema::create('credit_request_repayments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('credit_request_id')->constrained()->onDelete('cascade');
            $table->foreignId('installment_id')->nullable()->constrained('credit_request_installments')->onDelete('set null');
            $table->decimal('amount', 15, 2);
            $table->date('repayment_date');
            $table->string('payment_method');
            $table->string('reference')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('credit_request_repayments');
    }
};

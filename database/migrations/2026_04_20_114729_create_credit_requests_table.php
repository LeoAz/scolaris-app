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
        Schema::create('credit_requests', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique()->index();
            $table->foreignId('credit_type_id')->constrained()->onDelete('restrict');
            $table->foreignId('student_id')->constrained('stakeholders')->onDelete('restrict');
            $table->foreignId('guarantor_id')->constrained('stakeholders')->onDelete('restrict');
            $table->foreignId('created_by_id')->constrained('users')->onDelete('restrict');
            $table->foreignId('country_id')->constrained()->onDelete('restrict');

            $table->decimal('amount_requested', 15, 2);
            $table->decimal('initial_contribution', 15, 2)->default(0);

            $table->string('status')->default('creation')->index(); // creation, soumis, validater, rejecter, clos

            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('validated_at')->nullable();
            $table->timestamp('rejected_at')->nullable();

            $table->foreignId('validated_by_id')->nullable()->constrained('users')->onDelete('restrict');
            $table->foreignId('rejected_by_id')->nullable()->constrained('users')->onDelete('restrict');

            $table->text('rejection_reason')->nullable();

            $table->date('start_date')->nullable()->comment('Date de début de remboursement');
            $table->date('end_date')->nullable();

            $table->string('searchable')->nullable()->index();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('credit_requests');
    }
};

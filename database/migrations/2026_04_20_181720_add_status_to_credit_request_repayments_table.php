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
        Schema::table('credit_request_repayments', function (Blueprint $table) {
            $table->string('status')->default('pending')->after('notes');
            $table->timestamp('validated_at')->nullable()->after('status');
            $table->foreignId('validated_by_id')->nullable()->constrained('users')->after('validated_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('credit_request_repayments', function (Blueprint $table) {
            $table->dropForeign(['validated_by_id']);
            $table->dropColumn(['status', 'validated_at', 'validated_by_id']);
        });
    }
};

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
        Schema::create('stakeholders', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['student', 'guarantor'])->index();
            $table->string('last_name');
            $table->string('first_name');
            $table->string('email')->unique();
            $table->string('whatsapp_number')->nullable();
            $table->string('other_number')->nullable();
            $table->string('address')->nullable();
            $table->string('profession')->nullable();
            $table->string('amplitude_account_number')->nullable()->comment('Pour les étudiants');
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
        Schema::dropIfExists('stakeholders');
    }
};

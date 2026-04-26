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
        Schema::table('countries', function (Blueprint $table) {
            if (! Schema::hasColumn('countries', 'deleted_at')) {
                $table->softDeletes()->after('name');
            }
        });

        Schema::table('country_user', function (Blueprint $table) {
            if (! Schema::hasColumn('country_user', 'deleted_at')) {
                $table->softDeletes()->after('user_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('countries', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('country_user', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};

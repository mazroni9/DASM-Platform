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
        Schema::table('cars', function (Blueprint $table) {
            // Add the description column
             $table->decimal('min_price', 12, 2)->nullable();
             $table->decimal('max_price', 12, 2)->nullable();

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cars', function (Blueprint $table) {
            // Remove the description column if migration is rolled back
            $table->dropColumn('min_price');
            $table->dropColumn('max_price');

        });
    }
};

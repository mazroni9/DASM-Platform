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
            // Add the missing columns
            $table->string('color')->nullable();
            $table->string('engine')->nullable();
            $table->enum('transmission', ['automatic', 'manual', 'cvt'])->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cars', function (Blueprint $table) {
            // Remove the columns if migration is rolled back
            $table->dropColumn(['color', 'engine', 'transmission']);
        });
    }
};

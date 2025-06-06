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
            $table->foreignId('user_id')->nullable()->after('dealer_id')->constrained()->onDelete('cascade');
            // Make dealer_id nullable to accommodate both user and dealer ownership
            $table->foreignId('dealer_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cars', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');
            // If you want to revert dealer_id back to non-nullable, add that here
        });
    }
};

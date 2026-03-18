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
        Schema::table('broadcasts', function (Blueprint $table) {
            // Drop foreign key constraint first if exists
            if (Schema::hasColumn('broadcasts', 'venue_id')) {
                $table->dropForeign(['venue_id']);
                $table->dropColumn('venue_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('broadcasts', function (Blueprint $table) {
            // Add the column back if rolled back
            if (!Schema::hasColumn('broadcasts', 'venue_id')) {
                $table->unsignedBigInteger('venue_id')->nullable();
                $table->foreign('venue_id')->references('id')->on('venues')->onDelete('set null');
            }
        });
    }
};

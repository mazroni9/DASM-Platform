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
        Schema::table('auctions', function (Blueprint $table) {
            if (!Schema::hasColumn('auctions', 'market_id')) {
                $table->unsignedBigInteger('market_id')->nullable()->after('car_id');
                $table->foreign('market_id')->references('id')->on('markets')->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('auctions', function (Blueprint $table) {
            if (Schema::hasColumn('auctions', 'market_id')) {
                $table->dropForeign(['market_id']);
                $table->dropColumn('market_id');
            }
        });
    }
};

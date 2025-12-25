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
            // Add reserve_price column if it doesn't exist
            if (!Schema::hasColumn('auctions', 'reserve_price')) {
                $table->decimal('reserve_price', 12, 2)->nullable()->after('current_bid');
            }
            
            // Add other potentially missing columns required by the model
            if (!Schema::hasColumn('auctions', 'minimum_bid')) {
                $table->decimal('minimum_bid', 12, 2)->nullable();
            }
            
            if (!Schema::hasColumn('auctions', 'maximum_bid')) {
                $table->decimal('maximum_bid', 12, 2)->nullable();
            }
            
            if (!Schema::hasColumn('auctions', 'opening_price')) {
                $table->decimal('opening_price', 12, 2)->nullable();
            }
            
            if (!Schema::hasColumn('auctions', 'approved_for_live')) {
                $table->boolean('approved_for_live')->default(false);
            }
            
            if (!Schema::hasColumn('auctions', 'last_bid_time')) {
                $table->timestamp('last_bid_time')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('auctions', function (Blueprint $table) {
            $table->dropColumn([
                'reserve_price',
                'minimum_bid',
                'maximum_bid',
                'opening_price',
                'approved_for_live',
                'last_bid_time'
            ]);
        });
    }
};

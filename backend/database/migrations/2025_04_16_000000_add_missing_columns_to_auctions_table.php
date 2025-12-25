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
            // Add missing columns needed for the auction pricing system
            if (!Schema::hasColumn('auctions', 'min_price')) {
                $table->decimal('min_price', 12, 2)->nullable()->comment('Hidden minimum price (reserve price) set by seller');
            }
            
            if (!Schema::hasColumn('auctions', 'max_price')) {
                $table->decimal('max_price', 12, 2)->nullable()->comment('Hidden maximum price ceiling set by seller');
            }
            
            if (!Schema::hasColumn('auctions', 'auction_type')) {
                $table->string('auction_type')->default('silent_instant')->comment('Type of auction: live, live_instant, or silent_instant');
            }
            
            if (!Schema::hasColumn('auctions', 'description')) {
                $table->text('description')->nullable();
            }
            
            if (!Schema::hasColumn('auctions', 'control_room_approved')) {
                $table->boolean('control_room_approved')->default(false);
            }
            
            if (!Schema::hasColumn('auctions', 'extended_until')) {
                $table->dateTime('extended_until')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('auctions', function (Blueprint $table) {
            // Remove the columns if migration is rolled back
            $table->dropColumn([
                'min_price',
                'max_price',
                'auction_type',
                'description',
                'control_room_approved',
                'extended_until'
            ]);
        });
    }
};
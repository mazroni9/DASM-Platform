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
        Schema::table('bids', function (Blueprint $table) {
            $table->boolean('no_account')->default(false)->after('user_id');
            $table->string('bidder_name')->nullable()->after('no_account');
            
            // Make user_id nullable to support no_account bids
            $table->unsignedBigInteger('user_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bids', function (Blueprint $table) {
            $table->dropColumn(['no_account', 'bidder_name']);
            
            // Restore user_id as not nullable
            $table->unsignedBigInteger('user_id')->nullable(false)->change();
        });
    }
};
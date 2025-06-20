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
            // Make auction_id nullable since broadcasts can exist without being tied to a specific auction
            if (Schema::hasColumn('broadcasts', 'auction_id')) {
                $table->unsignedBigInteger('auction_id')->nullable()->change();
            }
            
            // Make stream_url nullable as it's not needed in the current workflow
            if (Schema::hasColumn('broadcasts', 'stream_url')) {
                $table->string('stream_url', 500)->nullable()->change();
            }
            
            // Make status nullable as it's not used in current workflow
            if (Schema::hasColumn('broadcasts', 'status')) {
                $table->string('status')->nullable()->change();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('broadcasts', function (Blueprint $table) {
            // Make fields required again if migration is rolled back
            if (Schema::hasColumn('broadcasts', 'auction_id')) {
                $table->unsignedBigInteger('auction_id')->nullable(false)->change();
            }
            
            if (Schema::hasColumn('broadcasts', 'stream_url')) {
                $table->string('stream_url', 500)->nullable(false)->change();
            }
            
            if (Schema::hasColumn('broadcasts', 'status')) {
                $table->string('status')->nullable(false)->default('scheduled')->change();
            }
        });
    }
};

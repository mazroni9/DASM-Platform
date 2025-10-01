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
        Schema::create('bid_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('auction_id')->constrained('auctions')->onDelete('cascade');
            $table->foreignId('bid_id')->constrained('bids')->onDelete('cascade');
            $table->foreignId('bidder_id')->constrained('users')->onDelete('cascade');
            $table->decimal('bid_amount', 19, 4);
            $table->string('currency', 3)->default('SAR');
            $table->enum('channel', ['web', 'app', 'onsite', 'agent', 'api']);
            $table->enum('event_type', ['bid_placed', 'bid_rejected', 'outbid', 'autobid_fired', 'bid_withdrawn']);
            $table->string('reason_code')->nullable();
            $table->timestampTz('server_ts_utc')->useCurrent();
            $table->timestampTz('client_ts')->nullable();
            $table->bigInteger('server_nano_seq');
            $table->ipAddress('ip_addr')->nullable();
            $table->text('user_agent')->nullable();
            $table->string('session_id')->nullable();
            $table->string('hash_prev', 64)->nullable();
            $table->string('hash_curr', 64)->nullable();

            // This table is append-only and should be partitioned by time (e.g., monthly or quarterly)
            // for performance. Partitioning logic should be handled at the database level.
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bid_events');
    }
};

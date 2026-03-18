<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('auction_test_events', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('run_id')->index();
            $table->string('event_type')->index(); // bid_sent, bid_confirmed, bid_rejected, error, timeout
            $table->unsignedInteger('latency_ms')->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->unsignedBigInteger('bid_id')->nullable();
            $table->decimal('bid_amount', 12, 2)->nullable();
            $table->text('message')->nullable();
            $table->json('meta')->nullable();
            $table->timestamp('occurred_at')->nullable();
            $table->timestamps();

            $table->foreign('run_id')->references('id')->on('auction_test_runs')->onDelete('cascade');
            $table->index(['run_id', 'event_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('auction_test_events');
    }
};

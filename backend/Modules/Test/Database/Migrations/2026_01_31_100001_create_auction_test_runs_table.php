<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('auction_test_runs', function (Blueprint $table) {
            $table->id();
            $table->string('scenario_key')->index();
            $table->string('status')->default('running')->index(); // running, completed, failed
            $table->unsignedInteger('user_count')->default(0);
            $table->unsignedInteger('duration_seconds')->default(0);
            $table->unsignedInteger('total_bids')->default(0);
            $table->unsignedInteger('successful_bids')->default(0);
            $table->unsignedInteger('failed_bids')->default(0);
            $table->unsignedInteger('avg_latency_ms')->nullable();
            $table->unsignedInteger('max_latency_ms')->nullable();
            $table->unsignedBigInteger('auction_id')->nullable()->comment('المزاد التجريبي المُنشأ');
            $table->json('options')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->index(['scenario_key', 'status']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('auction_test_runs');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('auction_activity_logs', function (Blueprint $table) {
            $table->id();
            $table->string('event_type', 64)->index();
            $table->string('subject_type', 64)->nullable()->index();
            $table->unsignedBigInteger('subject_id')->nullable()->index();
            $table->json('payload')->nullable();
            $table->timestamp('occurred_at')->useCurrent()->index();
            $table->timestamps();
        });

        Schema::table('auction_activity_logs', function (Blueprint $table) {
            $table->index(['occurred_at', 'event_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('auction_activity_logs');
    }
};

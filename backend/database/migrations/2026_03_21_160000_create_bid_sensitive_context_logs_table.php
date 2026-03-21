<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bid_sensitive_context_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('auction_id')->constrained()->cascadeOnDelete();
            $table->foreignId('car_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('bid_id')->nullable()->constrained('bids')->nullOnDelete();
            $table->string('client_session_id', 128)->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('geolocation_source', 32)->default('none');
            $table->string('permission_state', 32)->default('unavailable');
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->decimal('accuracy_meters', 12, 2)->nullable();
            $table->string('city', 191)->nullable();
            $table->string('region', 191)->nullable();
            $table->timestamp('captured_at')->nullable();
            $table->json('risk_flags')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
            $table->index(['auction_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bid_sensitive_context_logs');
    }
};

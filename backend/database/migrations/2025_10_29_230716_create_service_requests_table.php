<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('service_requests', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('venue_owner_id');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('extra_service_id');

            $table->string('car')->nullable();
            $table->text('notes')->nullable();

            $table->decimal('price', 10, 2)->nullable();
            $table->string('currency', 8)->default('SAR');

            $table->string('status', 32)->default('pending');

            $table->timestamp('requested_at')->useCurrent();
            $table->timestamp('completed_at')->nullable();

            $table->timestamps();

            $table->foreign('venue_owner_id')->references('id')->on('venue_owners');
            $table->foreign('user_id')->references('id')->on('users');
            $table->foreign('extra_service_id')->references('id')->on('extra_services');

            $table->index(['venue_owner_id', 'status']);
            $table->index(['extra_service_id']);
            $table->index(['requested_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_requests');
    }
};

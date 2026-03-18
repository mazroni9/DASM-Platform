<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('venue_commission_operations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('venue_owner_id')->constrained('venue_owners')->cascadeOnDelete();
            $table->unsignedBigInteger('car_id')->nullable(); // اختياري
            $table->string('car_title', 150)->nullable();     // لعرض سريع بدون join
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('SAR');
            $table->string('description', 255)->nullable();
            $table->timestamps();

            $table->index(['venue_owner_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('venue_commission_operations');
    }
};

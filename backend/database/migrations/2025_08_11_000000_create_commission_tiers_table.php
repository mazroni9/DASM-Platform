<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('commission_tiers', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->decimal('minPrice', 15, 2);
            $table->decimal('maxPrice', 15, 2)->nullable();
            $table->decimal('commissionAmount', 10, 2);
            $table->boolean('isProgressive')->default(false);
            $table->boolean('isActive')->default(true);
            $table->timestamp('createdAt')->nullable();
            $table->timestamp('updatedAt')->nullable();
            $table->index(['isActive', 'minPrice', 'maxPrice']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commission_tiers');
    }
};



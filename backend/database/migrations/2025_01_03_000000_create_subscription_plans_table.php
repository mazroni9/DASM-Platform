<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->string('slug', 255)->unique();
            $table->text('description')->nullable();
            $table->string('userType');
            $table->decimal('price', 10, 2);
            $table->integer('durationMonths');
            $table->boolean('isActive')->default(true);
            $table->integer('orderIndex')->default(0);
            $table->timestamp('createdAt')->nullable();
            $table->timestamp('updatedAt')->nullable();
            $table->index(['userType', 'isActive', 'orderIndex']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_plans');
    }
};


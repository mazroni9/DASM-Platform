<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('auction_test_results', function (Blueprint $table) {
            $table->id();
            $table->string('test_name')->index();
            $table->string('test_category')->index();
            $table->string('status')->default('pending')->index();
            $table->text('message')->nullable();
            $table->json('details')->nullable();
            $table->json('errors')->nullable();
            $table->integer('execution_time_ms')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['test_category', 'status']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('auction_test_results');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('market_reactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->constrained('market_articles')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('type', ['like', 'save', 'helpful']);
            $table->timestamps();

            $table->unique(['article_id', 'user_id', 'type']);
            $table->index(['article_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('market_reactions');
    }
};

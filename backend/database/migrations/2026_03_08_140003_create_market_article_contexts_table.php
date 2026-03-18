<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('market_article_contexts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->constrained('market_articles')->cascadeOnDelete();
            $table->string('context_type');
            $table->string('context_key')->nullable();
            $table->timestamps();

            $table->index(['article_id', 'context_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('market_article_contexts');
    }
};

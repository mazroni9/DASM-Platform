<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void {
    Schema::create('blog_posts', function (Blueprint $table) {
      $table->id();
      $table->foreignId('category_id')->constrained('blog_categories')->cascadeOnDelete();

      $table->string('title');
      $table->string('slug')->unique();

      $table->string('excerpt', 500)->nullable();
      $table->longText('content'); // HTML أو Markdown حسب ما تعمل في الأدمن

      $table->string('cover_image')->nullable(); // URL أو path
      $table->boolean('is_published')->default(false);
      $table->timestamp('published_at')->nullable();

      $table->string('seo_title')->nullable();
      $table->string('seo_description', 300)->nullable();

      $table->timestamps();

      $table->index(['is_published', 'published_at']);
      $table->index(['category_id']);
    });
  }

  public function down(): void {
    Schema::dropIfExists('blog_posts');
  }
};

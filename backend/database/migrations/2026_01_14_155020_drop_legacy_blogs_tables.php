<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // ✅ PostgreSQL: استخدم CASCADE عشان يفك أي Foreign Keys تلقائيًا
        DB::statement('DROP TABLE IF EXISTS blog_post_tags CASCADE');
        DB::statement('DROP TABLE IF EXISTS blog_posts CASCADE');
        DB::statement('DROP TABLE IF EXISTS blog_tags CASCADE');
        DB::statement('DROP TABLE IF EXISTS blog_categories CASCADE');
        DB::statement('DROP TABLE IF EXISTS blogs CASCADE'); // legacy

        // =========================
        // Recreate clean schema
        // =========================

        Schema::create('blog_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->timestamps();
        });

        Schema::create('blog_tags', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        Schema::create('blog_posts', function (Blueprint $table) {
            $table->id();

            // المستخدم صاحب المقال
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();

            // التصنيف (اختياري)
            $table->foreignId('category_id')
                ->nullable()
                ->constrained('blog_categories')
                ->nullOnDelete();

            $table->string('title');
            $table->string('slug')->unique();
            $table->text('excerpt')->nullable();
            $table->longText('content');
            $table->string('image')->nullable();

            $table->enum('status', ['draft', 'published'])->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->unsignedBigInteger('views')->default(0);

            $table->timestamps();

            $table->index(['status', 'published_at']);
        });

        Schema::create('blog_post_tags', function (Blueprint $table) {
            $table->id();
            $table->foreignId('blog_post_id')->constrained('blog_posts')->cascadeOnDelete();
            $table->foreignId('blog_tag_id')->constrained('blog_tags')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['blog_post_id', 'blog_tag_id']);
        });
    }

    public function down(): void
    {
        DB::statement('DROP TABLE IF EXISTS blog_post_tags CASCADE');
        DB::statement('DROP TABLE IF EXISTS blog_posts CASCADE');
        DB::statement('DROP TABLE IF EXISTS blog_tags CASCADE');
        DB::statement('DROP TABLE IF EXISTS blog_categories CASCADE');
        DB::statement('DROP TABLE IF EXISTS blogs CASCADE');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {

    public function up(): void
    {
        if (Schema::hasTable('blog_post_tags')) {

            Schema::table('blog_post_tags', function (Blueprint $table) {
                if (!Schema::hasColumn('blog_post_tags', 'id')) {
                    $table->id();
                }

                if (!Schema::hasColumn('blog_post_tags', 'blog_post_id')) {
                    $table->unsignedBigInteger('blog_post_id');
                }

                if (!Schema::hasColumn('blog_post_tags', 'blog_tag_id')) {
                    $table->unsignedBigInteger('blog_tag_id');
                }

                if (!Schema::hasColumn('blog_post_tags', 'created_at')) {
                    $table->timestamp('created_at')->nullable();
                }
                if (!Schema::hasColumn('blog_post_tags', 'updated_at')) {
                    $table->timestamp('updated_at')->nullable();
                }
            });

            // Unique composite index
            if (DB::getDriverName() === 'pgsql') {
                DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS blog_post_tags_blog_post_id_blog_tag_id_unique ON blog_post_tags (blog_post_id, blog_tag_id)');
            }

            // Foreign keys (pgsql safe, only if referenced tables exist)
            if (DB::getDriverName() === 'pgsql') {

                if (Schema::hasTable('blog_posts') && Schema::hasTable('blog_tags')) {

                    DB::statement("
                        DO $$
                        BEGIN
                            IF NOT EXISTS (
                                SELECT 1 FROM pg_constraint
                                WHERE conname = 'blog_post_tags_blog_post_id_foreign'
                            ) THEN
                                ALTER TABLE blog_post_tags
                                ADD CONSTRAINT blog_post_tags_blog_post_id_foreign
                                FOREIGN KEY (blog_post_id) REFERENCES blog_posts(id)
                                ON DELETE CASCADE;
                            END IF;
                        END $$;
                    ");

                    DB::statement("
                        DO $$
                        BEGIN
                            IF NOT EXISTS (
                                SELECT 1 FROM pg_constraint
                                WHERE conname = 'blog_post_tags_blog_tag_id_foreign'
                            ) THEN
                                ALTER TABLE blog_post_tags
                                ADD CONSTRAINT blog_post_tags_blog_tag_id_foreign
                                FOREIGN KEY (blog_tag_id) REFERENCES blog_tags(id)
                                ON DELETE CASCADE;
                            END IF;
                        END $$;
                    ");
                }
            }

            return;
        }

        // Create fresh
        Schema::create('blog_post_tags', function (Blueprint $table) {
            $table->id();
            $table->foreignId('blog_post_id')->constrained('blog_posts')->cascadeOnDelete();
            $table->foreignId('blog_tag_id')->constrained('blog_tags')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['blog_post_id', 'blog_tag_id']);
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS blog_post_tags_blog_post_id_blog_tag_id_unique ON blog_post_tags (blog_post_id, blog_tag_id)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('blog_post_tags');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {

    public function up(): void
    {
        if (Schema::hasTable('blog_posts')) {

            Schema::table('blog_posts', function (Blueprint $table) {
                if (!Schema::hasColumn('blog_posts', 'id')) {
                    $table->id();
                }

                if (!Schema::hasColumn('blog_posts', 'user_id')) {
                    $table->unsignedBigInteger('user_id');
                }

                if (!Schema::hasColumn('blog_posts', 'category_id')) {
                    $table->unsignedBigInteger('category_id')->nullable();
                }

                if (!Schema::hasColumn('blog_posts', 'title')) {
                    $table->string('title');
                }
                if (!Schema::hasColumn('blog_posts', 'slug')) {
                    $table->string('slug');
                }
                if (!Schema::hasColumn('blog_posts', 'excerpt')) {
                    $table->text('excerpt')->nullable();
                }
                if (!Schema::hasColumn('blog_posts', 'content')) {
                    $table->longText('content');
                }
                if (!Schema::hasColumn('blog_posts', 'image')) {
                    $table->string('image')->nullable();
                }

                // safer than enum in alter scenarios
                if (!Schema::hasColumn('blog_posts', 'status')) {
                    $table->string('status')->default('draft');
                }
                if (!Schema::hasColumn('blog_posts', 'published_at')) {
                    $table->timestamp('published_at')->nullable();
                }
                if (!Schema::hasColumn('blog_posts', 'views')) {
                    $table->unsignedBigInteger('views')->default(0);
                }

                if (!Schema::hasColumn('blog_posts', 'created_at')) {
                    $table->timestamp('created_at')->nullable();
                }
                if (!Schema::hasColumn('blog_posts', 'updated_at')) {
                    $table->timestamp('updated_at')->nullable();
                }
            });

            // Indexes (Postgres safe)
            if (DB::getDriverName() === 'pgsql') {
                DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS blog_posts_slug_unique ON blog_posts (slug)');
                DB::statement('CREATE INDEX IF NOT EXISTS blog_posts_status_published_at_index ON blog_posts (status, published_at)');
            }

            // Foreign keys (only if referenced tables exist)
            if (DB::getDriverName() === 'pgsql') {
                if (Schema::hasTable('users') && Schema::hasColumn('blog_posts', 'user_id')) {
                    DB::statement("
                        DO $$
                        BEGIN
                            IF NOT EXISTS (
                                SELECT 1 FROM pg_constraint
                                WHERE conname = 'blog_posts_user_id_foreign'
                            ) THEN
                                ALTER TABLE blog_posts
                                ADD CONSTRAINT blog_posts_user_id_foreign
                                FOREIGN KEY (user_id) REFERENCES users(id)
                                ON DELETE CASCADE;
                            END IF;
                        END $$;
                    ");
                }

                if (Schema::hasTable('blog_categories') && Schema::hasColumn('blog_posts', 'category_id')) {
                    DB::statement("
                        DO $$
                        BEGIN
                            IF NOT EXISTS (
                                SELECT 1 FROM pg_constraint
                                WHERE conname = 'blog_posts_category_id_foreign'
                            ) THEN
                                ALTER TABLE blog_posts
                                ADD CONSTRAINT blog_posts_category_id_foreign
                                FOREIGN KEY (category_id) REFERENCES blog_categories(id)
                                ON DELETE SET NULL;
                            END IF;
                        END $$;
                    ");
                }
            }

            return;
        }

        // Create fresh
        Schema::create('blog_posts', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();

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

        // Ensure indexes in pgsql too (safe)
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS blog_posts_slug_unique ON blog_posts (slug)');
            DB::statement('CREATE INDEX IF NOT EXISTS blog_posts_status_published_at_index ON blog_posts (status, published_at)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('blog_posts');
    }
};

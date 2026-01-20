<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {

    public function up(): void
    {
        // 1) إذا الجدول موجود، لا تحاول إنشاءه
        if (Schema::hasTable('blog_categories')) {
            // تأكد من الأعمدة لو ناقصة
            Schema::table('blog_categories', function (Blueprint $table) {
                if (!Schema::hasColumn('blog_categories', 'id')) {
                    $table->id();
                }
                if (!Schema::hasColumn('blog_categories', 'name')) {
                    $table->string('name');
                }
                if (!Schema::hasColumn('blog_categories', 'slug')) {
                    $table->string('slug');
                }
                if (!Schema::hasColumn('blog_categories', 'created_at')) {
                    $table->timestamp('created_at')->nullable();
                }
                if (!Schema::hasColumn('blog_categories', 'updated_at')) {
                    $table->timestamp('updated_at')->nullable();
                }
            });

            // تأكد من unique index على slug (آمن على PostgreSQL)
            if (DB::getDriverName() === 'pgsql') {
                DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS blog_categories_slug_unique ON blog_categories (slug)');
            }

            return;
        }

        // 2) إذا مش موجود: أنشئه
        Schema::create('blog_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug');
            $table->timestamps();
        });

        // unique index بطريقة آمنة
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS blog_categories_slug_unique ON blog_categories (slug)');
        } else {
            // fallback for other DBs
            Schema::table('blog_categories', function (Blueprint $table) {
                $table->unique('slug');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('blog_categories');
    }
};

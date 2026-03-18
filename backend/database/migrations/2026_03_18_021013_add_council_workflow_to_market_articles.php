<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('market_articles', function (Blueprint $table) {
            $table->foreignId('created_by_user_id')->nullable()->after('author_name')->constrained('users')->nullOnDelete();
        });
        if (Schema::getConnection()->getDriverName() === 'mysql') {
            \DB::statement("ALTER TABLE market_articles MODIFY COLUMN status ENUM('draft', 'pending_review', 'published', 'rejected', 'archived') NOT NULL DEFAULT 'draft'");
        }
    }

    public function down(): void
    {
        Schema::table('market_articles', function (Blueprint $table) {
            $table->dropForeign(['created_by_user_id']);
        });
        if (Schema::getConnection()->getDriverName() === 'mysql') {
            \DB::statement("ALTER TABLE market_articles MODIFY COLUMN status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft'");
        }
    }
};

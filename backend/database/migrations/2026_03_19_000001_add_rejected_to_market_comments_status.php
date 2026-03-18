<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE market_comments MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'hidden') NOT NULL DEFAULT 'pending'");
        }
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE market_comments MODIFY COLUMN status ENUM('pending', 'approved', 'hidden') NOT NULL DEFAULT 'approved'");
        }
    }
};

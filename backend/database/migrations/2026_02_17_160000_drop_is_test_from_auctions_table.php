<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('auctions', 'is_test')) {
            Schema::table('auctions', function (Blueprint $table) {
                $table->dropColumn('is_test');
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasColumn('auctions', 'is_test')) {
            Schema::table('auctions', function (Blueprint $table) {
                $table->boolean('is_test')->default(false)->after('id');
            });
        }
    }
};

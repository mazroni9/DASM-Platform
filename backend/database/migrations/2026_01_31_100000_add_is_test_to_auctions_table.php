<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('auctions', function (Blueprint $table) {
            if (!Schema::hasColumn('auctions', 'is_test')) {
                $table->boolean('is_test')->default(false)->after('id')->comment('مزاد تجريبي من موديول الاختبارات');
            }
        });
    }

    public function down(): void
    {
        Schema::table('auctions', function (Blueprint $table) {
            if (Schema::hasColumn('auctions', 'is_test')) {
                $table->dropColumn('is_test');
            }
        });
    }
};

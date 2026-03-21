<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * إخفاء سيارات من قائمة «سياراتي» / واجهة المالك دون حذف السجل أو تغيير المزادات.
     */
    public function up(): void
    {
        Schema::table('cars', function (Blueprint $table) {
            if (! Schema::hasColumn('cars', 'exclude_from_owner_dashboard')) {
                $table->boolean('exclude_from_owner_dashboard')->default(false);
            }
        });

        Schema::table('cars', function (Blueprint $table) {
            if (Schema::hasColumn('cars', 'exclude_from_owner_dashboard')) {
                $table->index(['user_id', 'exclude_from_owner_dashboard'], 'cars_user_exclude_owner_idx');
            }
        });
    }

    public function down(): void
    {
        Schema::table('cars', function (Blueprint $table) {
            if (Schema::hasColumn('cars', 'exclude_from_owner_dashboard')) {
                $table->dropIndex('cars_user_exclude_owner_idx');
                $table->dropColumn('exclude_from_owner_dashboard');
            }
        });
    }
};

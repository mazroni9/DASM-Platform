<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('venue_owners', function (Blueprint $table) {
            // نضيف الأعمدة لو مش موجودة أصلاً (تشغيل آمن أكثر)
            if (!Schema::hasColumn('venue_owners', 'commission_value')) {
                $table->decimal('commission_value', 12, 2)->default(0)->after('rating');
            }

            if (!Schema::hasColumn('venue_owners', 'commission_currency')) {
                // 3 حروف عملة (SAR, USD, ...). عدّل الحجم لو بتستخدم أكواد أطول
                $table->string('commission_currency', 3)->default('SAR')->after('commission_value');
            }

            if (!Schema::hasColumn('venue_owners', 'commission_note')) {
                $table->text('commission_note')->nullable()->after('commission_currency');
            }
        });
    }

    public function down(): void
    {
        Schema::table('venue_owners', function (Blueprint $table) {
            if (Schema::hasColumn('venue_owners', 'commission_value')) {
                $table->dropColumn('commission_value');
            }
            if (Schema::hasColumn('venue_owners', 'commission_currency')) {
                $table->dropColumn('commission_currency');
            }
            if (Schema::hasColumn('venue_owners', 'commission_note')) {
                $table->dropColumn('commission_note');
            }
        });
    }
};

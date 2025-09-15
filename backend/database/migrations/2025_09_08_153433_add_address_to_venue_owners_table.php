<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // أمان: ما يضيفش العمود لو موجود بالفعل
        if (!Schema::hasColumn('venue_owners', 'address')) {
            Schema::table('venue_owners', function (Blueprint $table) {
                // عرّف العمود
                $column = $table->string('address')->nullable();

                // رتّبه بعد venue_name فقط على MySQL/MariaDB
                if (DB::getDriverName() === 'mysql') {
                    $column->after('venue_name'); // غيّر الاسم هنا لو عايز مكان مختلف
                }
            });
        }
    }

    public function down(): void
    {
        // أمان: احذف العمود فقط لو موجود
        if (Schema::hasColumn('venue_owners', 'address')) {
            Schema::table('venue_owners', function (Blueprint $table) {
                $table->dropColumn('address');
            });
        }
    }
};

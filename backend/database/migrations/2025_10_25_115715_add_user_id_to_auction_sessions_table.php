<?php
// database/migrations/2025_01_01_000000_add_user_id_to_auction_sessions_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // خذ الـ schema الحالي (مثلاً public أو laravel) من إعدادات اتصال PG
        $schemaConf = DB::connection()->getConfig('search_path') ?? 'public';
        $schema = trim(explode(',', $schemaConf)[0]);

        // هل العمود user_id موجود؟
        $columnExists = (bool) DB::selectOne(
            "SELECT 1
             FROM information_schema.columns
             WHERE table_schema = ? AND table_name = ? AND column_name = ?",
            [$schema, 'auction_sessions', 'user_id']
        );

        // لو مش موجود؛ أضِف العمود فقط (بدون FK هنا لتفادي تعارض الأسماء)
        if (! $columnExists) {
            Schema::table('auction_sessions', function (Blueprint $table) {
                $table->unsignedBigInteger('user_id')->nullable()->after('id');
            });
        }

        // تأكد من وجود انديكس على user_id (بـ IF NOT EXISTS حتى لو كان العمود موجود قبل كده)
        DB::statement(
            'CREATE INDEX IF NOT EXISTS "auction_sessions_user_id_index"
             ON "'.$schema.'"."auction_sessions" ("user_id")'
        );

        // هل يوجد قيد FK على user_id بالفعل؟
        $fkExists = (bool) DB::selectOne(
            "SELECT 1
               FROM information_schema.table_constraints tc
               JOIN information_schema.key_column_usage kcu
                 ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
              WHERE tc.constraint_type = 'FOREIGN KEY'
                AND tc.table_schema = ?
                AND tc.table_name   = ?
                AND kcu.column_name = ?",
            [$schema, 'auction_sessions', 'user_id']
        );

        // لو مفيش FK؛ أضِفه مع ON DELETE SET NULL
        if (! $fkExists) {
            Schema::table('auction_sessions', function (Blueprint $table) {
                $table->foreign('user_id')
                      ->references('id')->on('users')
                      ->onDelete('set null'); // تعادل nullOnDelete()
            });
        }
    }

    public function down(): void
    {
        $schemaConf = DB::connection()->getConfig('search_path') ?? 'public';
        $schema = trim(explode(',', $schemaConf)[0]);

        // احذف أي قيود FK مربوطة بـ user_id (بغض النظر عن الاسم)
        $constraints = DB::select(
            "SELECT tc.constraint_name
               FROM information_schema.table_constraints tc
               JOIN information_schema.key_column_usage kcu
                 ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
              WHERE tc.constraint_type = 'FOREIGN KEY'
                AND tc.table_schema = ?
                AND tc.table_name   = ?
                AND kcu.column_name = ?",
            [$schema, 'auction_sessions', 'user_id']
        );

        foreach ($constraints as $c) {
            DB::statement(
                'ALTER TABLE "'.$schema.'"."auction_sessions" DROP CONSTRAINT IF EXISTS "'.$c->constraint_name.'"'
            );
        }

        // احذف الإنديكس لو موجود
        DB::statement(
            'DROP INDEX IF EXISTS "auction_sessions_user_id_index"'
        );

        // احذف العمود لو موجود
        $columnExists = (bool) DB::selectOne(
            "SELECT 1
             FROM information_schema.columns
             WHERE table_schema = ? AND table_name = ? AND column_name = ?",
            [$schema, 'auction_sessions', 'user_id']
        );

        if ($columnExists) {
            Schema::table('auction_sessions', function (Blueprint $table) {
                $table->dropColumn('user_id');
            });
        }
    }
};

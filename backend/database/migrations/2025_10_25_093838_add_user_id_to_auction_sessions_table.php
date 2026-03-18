<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // حدِّد الـschema النشط في PostgreSQL (public أو laravel ... إلخ)
        $schemaConf = DB::connection()->getConfig('search_path') ?? 'public';
        $schema = trim(explode(',', $schemaConf)[0]);

        // هل العمود موجود؟
        $columnExists = (bool) DB::selectOne(
            "SELECT 1
             FROM information_schema.columns
             WHERE table_schema = ? AND table_name = ? AND column_name = ?",
            [$schema, 'auction_sessions', 'user_id']
        );

        if (! $columnExists) {
            Schema::table('auction_sessions', function (Blueprint $table) {
                // نضيف العمود بدون FK تلقائي لتفادي التعارض
                $table->unsignedBigInteger('user_id')->nullable()->after('id');
            });
        }

        // هل يوجد قيد مفتاح خارجي على user_id؟
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

        if (! $fkExists) {
            Schema::table('auction_sessions', function (Blueprint $table) {
                $table->foreign('user_id')
                      ->references('id')->on('users')
                      ->onDelete('cascade');
            });
        }
    }

    public function down(): void
    {
        $schemaConf = DB::connection()->getConfig('search_path') ?? 'public';
        $schema = trim(explode(',', $schemaConf)[0]);

        // احذف أي قيود FK على user_id (بغض النظر عن الاسم)
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

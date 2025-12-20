<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // العمود اللي عليه القيود غالبًا type أو role
        $col = null;

        if (Schema::hasColumn('users', 'role')) {
            $col = 'role';
        } elseif (Schema::hasColumn('users', 'type')) {
            $col = 'type';
        }

        if (!$col) {
            return;
        }

        // ✅ Drop old constraint if exists (PostgreSQL)
        DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');

        // ✅ Recreate constraint with employee included
        DB::statement("
            ALTER TABLE users
            ADD CONSTRAINT users_role_check
            CHECK ({$col} IN (
                'super_admin','admin','moderator','venue_owner','investor','dealer','user','employee'
            ))
        ");
    }

    public function down(): void
    {
        $col = null;

        if (Schema::hasColumn('users', 'role')) {
            $col = 'role';
        } elseif (Schema::hasColumn('users', 'type')) {
            $col = 'type';
        }

        if (!$col) {
            return;
        }

        DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');

        DB::statement("
            ALTER TABLE users
            ADD CONSTRAINT users_role_check
            CHECK ({$col} IN (
                'super_admin','admin','moderator','venue_owner','investor','dealer','user'
            ))
        ");
    }
};

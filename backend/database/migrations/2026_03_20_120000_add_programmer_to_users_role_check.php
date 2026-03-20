<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
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
                'super_admin','admin','moderator','venue_owner','investor','dealer','user','employee','programmer'
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
                'super_admin','admin','moderator','venue_owner','investor','dealer','user','employee'
            ))
        ");
    }
};

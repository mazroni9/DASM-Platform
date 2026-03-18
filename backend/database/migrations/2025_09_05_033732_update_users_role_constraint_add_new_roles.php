<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('users')) {
            return;
        }

        $validRoles = ['admin', 'dealer', 'user', 'moderator', 'venue_owner', 'investor'];

        // Determine which column exists: role or type
        $roleColumn = null;
        if (Schema::hasColumn('users', 'role')) {
            $roleColumn = 'role';
        } elseif (Schema::hasColumn('users', 'type')) {
            $roleColumn = 'type';
        }

        // If neither exists, do nothing (avoid crashing)
        if (!$roleColumn) {
            // Still attempt constraint drop/add only if 'role' exists (it doesn't), so just exit safely
            return;
        }

        // Fix invalid values -> default to 'user'
        $usersWithInvalidRoles = DB::table('users')
            ->whereNotIn($roleColumn, $validRoles)
            ->select('id', $roleColumn)
            ->get();

        foreach ($usersWithInvalidRoles as $u) {
            DB::table('users')
                ->where('id', $u->id)
                ->update([$roleColumn => 'user']);
        }

        // Only manage the CHECK constraint if the actual constraint column is 'role'
        // (Your SQL constraint references role)
        if ($roleColumn === 'role') {
            DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;");

            // Safer/cleaner PG check constraint
            DB::statement("
                ALTER TABLE users
                ADD CONSTRAINT users_role_check
                CHECK (role::text = ANY (ARRAY[
                    'admin','dealer','user','moderator','venue_owner','investor'
                ]::text[]));
            ");
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('users')) {
            return;
        }

        if (Schema::hasColumn('users', 'role')) {
            DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;");

            DB::statement("
                ALTER TABLE users
                ADD CONSTRAINT users_role_check
                CHECK (role::text = ANY (ARRAY[
                    'admin','dealer','user','moderator'
                ]::text[]));
            ");
        }
    }
};

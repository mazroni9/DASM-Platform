<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop the existing role constraint
        DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;");

        // Add the updated role constraint with new roles including super_admin
        DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role::text = ANY (ARRAY['admin'::character varying, 'dealer'::character varying, 'user'::character varying, 'moderator'::character varying, 'venue_owner'::character varying, 'investor'::character varying, 'super_admin'::character varying]::text[]));");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop the updated role constraint
        DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;");

        // Restore the previous role constraint (without super_admin)
        DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role::text = ANY (ARRAY['admin'::character varying, 'dealer'::character varying, 'user'::character varying, 'moderator'::character varying, 'venue_owner'::character varying, 'investor'::character varying]::text[]));");
    }
};

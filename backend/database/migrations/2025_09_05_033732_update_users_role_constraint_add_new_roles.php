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
        // First, check if there are any users with invalid roles and update them
        $validRoles = ['admin', 'dealer', 'user', 'moderator', 'venue_owner', 'investor'];
        
        // Get all users with invalid roles
        $usersWithInvalidRoles = DB::table('users')
            ->whereNotIn('role', $validRoles)
            ->get();
        
        // Update invalid roles to 'user' as default
        foreach ($usersWithInvalidRoles as $user) {
            DB::table('users')
                ->where('id', $user->id)
                ->update(['role' => 'user']);
            
            echo "Updated user ID {$user->id} role from '{$user->role}' to 'user'\n";
        }
        
        // Drop the existing role constraint
        DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;");
        
        // Add the updated role constraint with new roles
        DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role::text = ANY (ARRAY['admin'::character varying, 'dealer'::character varying, 'user'::character varying, 'moderator'::character varying, 'venue_owner'::character varying, 'investor'::character varying]::text[]));");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop the updated role constraint
        DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;");
        
        // Restore the previous role constraint (without venue_owner and investor)
        DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role::text = ANY (ARRAY['admin'::character varying, 'dealer'::character varying, 'user'::character varying, 'moderator'::character varying]::text[]));");
    }
};

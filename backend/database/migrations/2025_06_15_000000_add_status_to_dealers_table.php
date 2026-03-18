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
        // Check if the status column exists with the old enum values
        if (Schema::hasColumn('dealers', 'status')) {
            // Drop the existing check constraint
            DB::statement('ALTER TABLE dealers DROP CONSTRAINT IF EXISTS dealers_status_check');
            
            // Modify the column to use the new enum values
            DB::statement("ALTER TABLE dealers ADD CONSTRAINT dealers_status_check CHECK (status::text = ANY (ARRAY['pending'::character varying, 'active'::character varying, 'rejected'::character varying]::text[]))");
            
            // Set default value for status column
            DB::statement("ALTER TABLE dealers ALTER COLUMN status SET DEFAULT 'pending'");
        }

        // Migrate existing data: if is_active is true, set status to active, otherwise pending
        DB::table('dealers')->where('is_active', true)->update(['status' => 'active']);
        DB::table('dealers')->where('is_active', false)->update(['status' => 'pending']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restore the original constraint if the column exists
        if (Schema::hasColumn('dealers', 'status')) {
            // Drop the new constraint
            DB::statement('ALTER TABLE dealers DROP CONSTRAINT IF EXISTS dealers_status_check');
            
            // Add back the original constraint
            DB::statement("ALTER TABLE dealers ADD CONSTRAINT dealers_status_check CHECK (status::text = ANY (ARRAY['active'::character varying, 'inactive'::character varying]::text[]))");
            
            // Restore the original default value
            DB::statement("ALTER TABLE dealers ALTER COLUMN status SET DEFAULT 'active'");
        }
    }
};
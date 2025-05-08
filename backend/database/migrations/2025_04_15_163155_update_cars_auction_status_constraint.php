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
        // First, drop the existing constraint
        DB::statement('ALTER TABLE cars DROP CONSTRAINT IF EXISTS cars_auction_status_check');
        
        // Then add a new constraint with 'available' as a valid value
        DB::statement("ALTER TABLE cars ADD CONSTRAINT cars_auction_status_check
            CHECK (auction_status::text = ANY (ARRAY['pending'::text, 'active'::text, 'closed'::text, 'cancelled'::text, 'available'::text, 'in_auction'::text, 'sold'::text]))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to original constraint without 'available'
        DB::statement('ALTER TABLE cars DROP CONSTRAINT IF EXISTS cars_auction_status_check');
        DB::statement("ALTER TABLE cars ADD CONSTRAINT cars_auction_status_check
            CHECK (auction_status::text = ANY (ARRAY['pending'::text, 'active'::text, 'closed'::text, 'cancelled'::text]))");
    }
};

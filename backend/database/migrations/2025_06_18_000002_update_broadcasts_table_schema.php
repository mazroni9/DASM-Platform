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
        // Try alternative approach to avoid any issues with column modifications
        DB::statement('ALTER TABLE broadcasts ALTER COLUMN auction_id DROP NOT NULL');
        DB::statement('ALTER TABLE broadcasts ALTER COLUMN stream_url DROP NOT NULL');
        DB::statement('ALTER TABLE broadcasts ALTER COLUMN status DROP NOT NULL');
        
        // Set default values for existing rows
        DB::statement("UPDATE broadcasts SET stream_url = youtube_embed_url WHERE stream_url IS NULL");
        DB::statement("UPDATE broadcasts SET status = 'active' WHERE status IS NULL");
        
        // Make other fields nullable if they exist
        if (Schema::hasColumn('broadcasts', 'started_at')) {
            DB::statement('ALTER TABLE broadcasts ALTER COLUMN started_at DROP NOT NULL');
        }
        if (Schema::hasColumn('broadcasts', 'ended_at')) {
            DB::statement('ALTER TABLE broadcasts ALTER COLUMN ended_at DROP NOT NULL');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Not implementing the reverse to avoid errors if data has been inserted with nulls
        // If needed to reverse, would need to first update all NULL values to valid defaults
    }
};

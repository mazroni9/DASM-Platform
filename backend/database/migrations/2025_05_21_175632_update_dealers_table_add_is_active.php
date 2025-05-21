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
        Schema::table('dealers', function (Blueprint $table) {
            // Check if verification_status column exists
            if (Schema::hasColumn('dealers', 'verification_status')) {
                // First add is_active column, defaulting to false
                $table->boolean('is_active')->default(false);
                
                // Migrate data from verification_status to is_active
                DB::statement("UPDATE dealers SET is_active = true WHERE verification_status = 'approved'");
                
                // Drop the old column
                $table->dropColumn('verification_status');
            } else {
                // If verification_status doesn't exist, just add is_active
                $table->boolean('is_active')->default(false);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('dealers', function (Blueprint $table) {
            // Add back verification_status column
            if (!Schema::hasColumn('dealers', 'verification_status')) {
                $table->enum('verification_status', ['pending', 'approved', 'rejected'])->default('pending');
                
                // Migrate data back from is_active to verification_status
                DB::statement("UPDATE dealers SET verification_status = 'approved' WHERE is_active = true");
                DB::statement("UPDATE dealers SET verification_status = 'pending' WHERE is_active = false");
            }
            
            // Drop is_active column
            if (Schema::hasColumn('dealers', 'is_active')) {
                $table->dropColumn('is_active');
            }
        });
    }
};

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
        Schema::table('users', function (Blueprint $table) {
            // Add status field with enum values
            $table->enum('status', ['pending', 'active', 'rejected'])->default('pending')->after('is_active');
        });

        // Migrate existing data: if is_active is true, set status to active, otherwise pending
        DB::table('users')->where('is_active', true)->update(['status' => 'active']);
        DB::table('users')->where('is_active', false)->update(['status' => 'pending']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};

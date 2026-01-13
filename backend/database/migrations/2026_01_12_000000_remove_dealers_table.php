<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     * 
     * This migration removes the dealers table completely.
     * All dealer identification will use user.type = 'dealer' instead.
     */
    public function up(): void
    {
        // 1. Migrate any cars that have dealer_id but no user_id
        // Map dealer_id -> user_id through dealers.user_id
        if (Schema::hasColumn('cars', 'dealer_id')) {
            DB::statement("
                UPDATE cars 
                SET user_id = (SELECT user_id FROM dealers WHERE dealers.id = cars.dealer_id)
                WHERE cars.dealer_id IS NOT NULL 
                AND cars.user_id IS NULL
            ");

            // 2. Drop foreign key constraint on dealer_id
            Schema::table('cars', function (Blueprint $table) {
                // Try to drop foreign key if it exists
                try {
                    $table->dropForeign(['dealer_id']);
                } catch (\Exception $e) {
                    // Foreign key might not exist, continue
                }
            });

            // 3. Drop dealer_id column from cars
            Schema::table('cars', function (Blueprint $table) {
                $table->dropColumn('dealer_id');
            });
        }

        // 4. Drop dealer-related migrations tables data
        // Remove indexes that reference dealers
        if (Schema::hasTable('dealers')) {
            Schema::dropIfExists('dealers');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate dealers table
        Schema::create('dealers', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('user_id');
            $table->string('company_name');
            $table->string('commercial_registry', 50)->nullable();
            $table->boolean('is_active')->default(true);
            $table->string('status')->default('pending');
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        // Add dealer_id back to cars
        Schema::table('cars', function (Blueprint $table) {
            $table->unsignedBigInteger('dealer_id')->nullable()->after('id');
            $table->foreign('dealer_id')->references('id')->on('dealers')->onDelete('cascade');
        });
    }
};

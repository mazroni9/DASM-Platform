<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('dealers', function (Blueprint $table) {
            if (Schema::hasColumn('dealers','cr_number')) {
                $table->renameColumn('cr_number', 'commercial_registry');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('dealers', function (Blueprint $table) {
             if (Schema::hasColumn('dealers','commercial_registry')) {
                $table->renameColumn( 'commercial_registry','cr_number');
            }
        });
    }
};

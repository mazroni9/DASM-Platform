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
        // أضِف العمود فقط لو مش موجود
        if (! Schema::hasColumn('bids', 'increment')) {
            Schema::table('bids', function (Blueprint $table) {
                // default(0) رقمية + NOT NULL
                $table->decimal('increment', 12, 2)->default(0)->nullable(false);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // احذف العمود فقط لو موجود
        if (Schema::hasColumn('bids', 'increment')) {
            Schema::table('bids', function (Blueprint $table) {
                $table->dropColumn('increment');
            });
        }
    }
};

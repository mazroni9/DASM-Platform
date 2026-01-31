<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration to make legacy fee columns nullable.
 * 
 * These columns (tam_fee, net_amount) are no longer used in the new
 * settlement flow. The new flow uses service_fees_total calculated
 * via CommissionTier::calculateServiceFees() which includes a fixed
 * 600 SAR admin fee instead of separate tam_fee and muroor_fee.
 * 
 * Old records with data are preserved for historical reference.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('settlements', function (Blueprint $table) {
            // Make legacy columns nullable so new settlements don't require them
            $table->decimal('tam_fee', 10, 2)->nullable()->change();
            $table->decimal('net_amount', 10, 2)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('settlements', function (Blueprint $table) {
            // Revert to NOT NULL (will fail if there are NULL values)
            $table->decimal('tam_fee', 10, 2)->nullable(false)->change();
            $table->decimal('net_amount', 10, 2)->nullable(false)->change();
        });
    }
};

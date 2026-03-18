<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Drop legacy fee columns that are no longer used.
 * 
 * The new settlement flow uses:
 * - service_fees_total (calculated via CommissionTier::calculateServiceFees())
 * - platform_commission
 * 
 * Instead of the old separate fields:
 * - tam_fee, muroor_fee, net_amount, myfatoorah_fee
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('settlements', function (Blueprint $table) {
            $table->dropColumn([
                'tam_fee',
                'net_amount',
                'muroor_fee',
                'myfatoorah_fee'
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('settlements', function (Blueprint $table) {
            $table->decimal('tam_fee', 10, 2)->nullable();
            $table->decimal('net_amount', 10, 2)->nullable();
            $table->decimal('muroor_fee', 10, 2)->nullable();
            $table->decimal('myfatoorah_fee', 10, 2)->nullable();
        });
    }
};

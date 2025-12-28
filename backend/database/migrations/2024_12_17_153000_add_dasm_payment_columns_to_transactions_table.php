<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * DASM Dual-Page Model - Transaction Payment Columns
     * Adds fields for:
     * - Step 1: Online Service Fees Payment (Moyasar)
     * - Step 2: Offline Bank Transfer (Car Price)
     */
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            // Transaction Reference
            $table->string('transaction_ref', 50)->nullable()->unique()->after('id');

            // Car Price
            $table->decimal('car_price', 12, 2)->nullable()->after('amount');

            // Phase 1: Online Payment Fields (Service Fees)
            $table->decimal('platform_commission', 12, 2)->nullable()->after('car_price');
            $table->decimal('vat_amount', 12, 2)->nullable()->after('platform_commission');
            $table->decimal('transfer_fee', 12, 2)->default(600.00)->after('vat_amount'); // Fixed 600 SAR
            $table->decimal('gateway_fee', 12, 2)->nullable()->after('transfer_fee');
            $table->decimal('service_fees_total', 12, 2)->nullable()->after('gateway_fee');
            $table->string('service_fees_status', 20)->default('PENDING')->after('service_fees_total');

            // Phase 2: Offline Transfer Fields (Car Price)
            $table->decimal('vehicle_price_total', 12, 2)->nullable()->after('service_fees_status');
            $table->string('escrow_payment_status', 20)->default('PENDING')->after('vehicle_price_total');
            $table->string('escrow_iban', 50)->nullable()->after('escrow_payment_status');
            $table->string('verification_code', 20)->nullable()->after('escrow_iban'); // e.g., DASM-1234
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn([
                'transaction_ref',
                'car_price',
                'platform_commission',
                'vat_amount',
                'transfer_fee',
                'gateway_fee',
                'service_fees_total',
                'service_fees_status',
                'vehicle_price_total',
                'escrow_payment_status',
                'escrow_iban',
                'verification_code',
            ]);
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * DASM-e Dual-Page Payment Model - ClickPay Integration
     * Adds columns for:
     * - Phase 1: Online Service Fees (via ClickPay)
     * - Phase 2: Offline Bank Transfer (Car Price)
     * - Partner/Individual Logic
     */
    public function up(): void
    {
        Schema::table('settlements', function (Blueprint $table) {
            // Core Deal Info
            $table->decimal('car_price', 12, 2)->nullable()->after('final_price');
            $table->decimal('platform_commission', 12, 2)->nullable()->after('car_price');

            // Phase 1: Service Fees (Online via ClickPay)
            $table->decimal('service_fees_total', 12, 2)->nullable()->after('buyer_net_amount');
            $table->string('service_fees_payment_status', 20)->default('PENDING')->after('service_fees_total');
            $table->string('clickpay_transaction_ref', 100)->nullable()->after('service_fees_payment_status');

            // Phase 2: Vehicle Price (Offline/Escrow)
            $table->decimal('vehicle_price_total', 12, 2)->nullable()->after('clickpay_transaction_ref');
            $table->string('escrow_payment_status', 20)->default('PENDING')->after('vehicle_price_total');

            // Partner Logic
            $table->string('seller_type', 20)->nullable()->after('escrow_payment_status');
            $table->decimal('seller_commission_deduction', 12, 2)->nullable()->after('seller_type');
            $table->decimal('partner_incentive', 12, 2)->nullable()->after('seller_commission_deduction');
            $table->string('escrow_release_status', 20)->default('NOT_APPLICABLE')->after('partner_incentive');

            // Verification
            $table->string('verification_code', 20)->nullable()->after('escrow_release_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('settlements', function (Blueprint $table) {
            $table->dropColumn([
                'car_price',
                'platform_commission',
                'service_fees_total',
                'service_fees_payment_status',
                'clickpay_transaction_ref',
                'vehicle_price_total',
                'escrow_payment_status',
                'seller_type',
                'seller_commission_deduction',
                'partner_incentive',
                'escrow_release_status',
                'verification_code',
            ]);
        });
    }
};

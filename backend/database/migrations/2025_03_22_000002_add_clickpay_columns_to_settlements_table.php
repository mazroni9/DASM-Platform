<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('settlements')) {
            // prevents migrate:fresh crash if settlements table isn't created yet
            return;
        }

        Schema::table('settlements', function (Blueprint $table) {
            // Core Deal Info
            if (!Schema::hasColumn('settlements', 'car_price')) {
                $table->decimal('car_price', 12, 2)->nullable()->after('final_price');
            }
            if (!Schema::hasColumn('settlements', 'platform_commission')) {
                $table->decimal('platform_commission', 12, 2)->nullable()->after('car_price');
            }

            // Phase 1: Service Fees (Online via ClickPay)
            if (!Schema::hasColumn('settlements', 'service_fees_total')) {
                $table->decimal('service_fees_total', 12, 2)->nullable()->after('buyer_net_amount');
            }
            if (!Schema::hasColumn('settlements', 'service_fees_payment_status')) {
                $table->string('service_fees_payment_status', 20)->default('PENDING')->after('service_fees_total');
            }
            if (!Schema::hasColumn('settlements', 'clickpay_transaction_ref')) {
                $table->string('clickpay_transaction_ref', 100)->nullable()->after('service_fees_payment_status');
            }

            // Phase 2: Vehicle Price (Offline/Escrow)
            if (!Schema::hasColumn('settlements', 'vehicle_price_total')) {
                $table->decimal('vehicle_price_total', 12, 2)->nullable()->after('clickpay_transaction_ref');
            }
            if (!Schema::hasColumn('settlements', 'escrow_payment_status')) {
                $table->string('escrow_payment_status', 20)->default('PENDING')->after('vehicle_price_total');
            }

            // Partner Logic
            if (!Schema::hasColumn('settlements', 'seller_type')) {
                $table->string('seller_type', 20)->nullable()->after('escrow_payment_status');
            }
            if (!Schema::hasColumn('settlements', 'seller_commission_deduction')) {
                $table->decimal('seller_commission_deduction', 12, 2)->nullable()->after('seller_type');
            }
            if (!Schema::hasColumn('settlements', 'partner_incentive')) {
                $table->decimal('partner_incentive', 12, 2)->nullable()->after('seller_commission_deduction');
            }
            if (!Schema::hasColumn('settlements', 'escrow_release_status')) {
                $table->string('escrow_release_status', 20)->default('NOT_APPLICABLE')->after('partner_incentive');
            }

            // Verification
            if (!Schema::hasColumn('settlements', 'verification_code')) {
                $table->string('verification_code', 20)->nullable()->after('escrow_release_status');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('settlements')) {
            return;
        }

        Schema::table('settlements', function (Blueprint $table) {
            $cols = [
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
            ];

            foreach ($cols as $col) {
                if (Schema::hasColumn('settlements', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};

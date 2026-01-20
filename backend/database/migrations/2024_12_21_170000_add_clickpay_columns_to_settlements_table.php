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
            if (!Schema::hasColumn('settlements', 'car_price')) {
                $table->decimal('car_price', 12, 2)->nullable();
            }
            if (!Schema::hasColumn('settlements', 'platform_commission')) {
                $table->decimal('platform_commission', 12, 2)->nullable();
            }

            if (!Schema::hasColumn('settlements', 'service_fees_total')) {
                $table->decimal('service_fees_total', 12, 2)->nullable();
            }
            if (!Schema::hasColumn('settlements', 'service_fees_payment_status')) {
                $table->string('service_fees_payment_status', 20)->default('PENDING');
            }
            if (!Schema::hasColumn('settlements', 'clickpay_transaction_ref')) {
                $table->string('clickpay_transaction_ref', 100)->nullable();
            }

            if (!Schema::hasColumn('settlements', 'vehicle_price_total')) {
                $table->decimal('vehicle_price_total', 12, 2)->nullable();
            }
            if (!Schema::hasColumn('settlements', 'escrow_payment_status')) {
                $table->string('escrow_payment_status', 20)->default('PENDING');
            }

            if (!Schema::hasColumn('settlements', 'seller_type')) {
                $table->string('seller_type', 20)->nullable();
            }
            if (!Schema::hasColumn('settlements', 'seller_commission_deduction')) {
                $table->decimal('seller_commission_deduction', 12, 2)->nullable();
            }
            if (!Schema::hasColumn('settlements', 'partner_incentive')) {
                $table->decimal('partner_incentive', 12, 2)->nullable();
            }
            if (!Schema::hasColumn('settlements', 'escrow_release_status')) {
                $table->string('escrow_release_status', 20)->default('NOT_APPLICABLE');
            }

            if (!Schema::hasColumn('settlements', 'verification_code')) {
                $table->string('verification_code', 20)->nullable();
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

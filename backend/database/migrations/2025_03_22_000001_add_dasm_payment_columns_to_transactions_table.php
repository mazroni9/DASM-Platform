<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // IMPORTANT: prevents migrate:fresh failure if transactions table isn't created yet
        if (!Schema::hasTable('transactions')) {
            return;
        }

        Schema::table('transactions', function (Blueprint $table) {

            // Transaction Reference
            if (!Schema::hasColumn('transactions', 'transaction_ref')) {
                $table->string('transaction_ref', 50)->nullable()->unique()->after('id');
            }

            // Car Price
            if (!Schema::hasColumn('transactions', 'car_price')) {
                $table->decimal('car_price', 12, 2)->nullable()->after('amount');
            }


            // Phase 1: Online Payment Fields (Service Fees)
            if (!Schema::hasColumn('transactions', 'platform_commission')) {
                $table->decimal('platform_commission', 12, 2)->nullable()->after('car_price');
            }
            if (!Schema::hasColumn('transactions', 'vat_amount')) {
                $table->decimal('vat_amount', 12, 2)->nullable()->after('platform_commission');
            }
            if (!Schema::hasColumn('transactions', 'transfer_fee')) {
                $table->decimal('transfer_fee', 12, 2)->default(600.00)->after('vat_amount'); // Fixed 600 SAR
            }
            if (!Schema::hasColumn('transactions', 'gateway_fee')) {
                $table->decimal('gateway_fee', 12, 2)->nullable()->after('transfer_fee');
            }
            if (!Schema::hasColumn('transactions', 'service_fees_total')) {
                $table->decimal('service_fees_total', 12, 2)->nullable()->after('gateway_fee');
            }
            if (!Schema::hasColumn('transactions', 'service_fees_status')) {
                $table->string('service_fees_status', 20)->default('PENDING')->after('service_fees_total');
            }

            // Phase 2: Offline Transfer Fields (Car Price)
            if (!Schema::hasColumn('transactions', 'vehicle_price_total')) {
                $table->decimal('vehicle_price_total', 12, 2)->nullable()->after('service_fees_status');
            }
            if (!Schema::hasColumn('transactions', 'escrow_payment_status')) {
                $table->string('escrow_payment_status', 20)->default('PENDING')->after('vehicle_price_total');
            }
            if (!Schema::hasColumn('transactions', 'escrow_iban')) {
                $table->string('escrow_iban', 50)->nullable()->after('escrow_payment_status');
            }
            if (!Schema::hasColumn('transactions', 'verification_code')) {
                $table->string('verification_code', 20)->nullable()->after('escrow_iban'); // e.g., DASM-1234
            }
        });

        // Unique index for transaction_ref (safe on Postgres, and won't crash if exists)
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS transactions_transaction_ref_unique ON transactions (transaction_ref)');
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('transactions')) {
            return;
        }

        // Drop columns only if they exist (safer)
        Schema::table('transactions', function (Blueprint $table) {
            $cols = [
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
            ];

            foreach ($cols as $col) {
                if (Schema::hasColumn('transactions', $col)) {
                    $table->dropColumn($col);
                }
            }
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS transactions_transaction_ref_unique');
        }
    }
};

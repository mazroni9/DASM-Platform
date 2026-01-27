<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // -------- settlements (guard everything) --------
        if (Schema::hasTable('settlements')) {

            // Rename only if old exists and new doesn't
            if (
                Schema::hasColumn('settlements', 'clickpay_transaction_ref')
                && !Schema::hasColumn('settlements', 'service_fees_payment_ref')
            ) {
                Schema::table('settlements', function (Blueprint $table) {
                    $table->renameColumn('clickpay_transaction_ref', 'service_fees_payment_ref');
                });
            }

            // Add gateway column only if missing
            if (!Schema::hasColumn('settlements', 'service_fees_gateway')) {
                Schema::table('settlements', function (Blueprint $table) {
                    $table->string('service_fees_gateway', 50)
                        ->default('CLICKPAY')
                        ->comment('Payment gateway used: MOYASAR, CLICKPAY');
                });
            }
        }

        // -------- transactions (also guard) --------
        if (Schema::hasTable('transactions') && !Schema::hasColumn('transactions', 'payment_provider')) {
            Schema::table('transactions', function (Blueprint $table) {
                $table->string('payment_provider', 50)
                    ->nullable()
                    ->comment('Payment gateway: MOYASAR, CLICKPAY');
            });
        }
    }

    public function down(): void
    {
        // settlements
        if (Schema::hasTable('settlements')) {

            if (Schema::hasColumn('settlements', 'service_fees_gateway')) {
                Schema::table('settlements', function (Blueprint $table) {
                    $table->dropColumn('service_fees_gateway');
                });
            }

            if (
                Schema::hasColumn('settlements', 'service_fees_payment_ref')
                && !Schema::hasColumn('settlements', 'clickpay_transaction_ref')
            ) {
                Schema::table('settlements', function (Blueprint $table) {
                    $table->renameColumn('service_fees_payment_ref', 'clickpay_transaction_ref');
                });
            }
        }

        // transactions
        if (Schema::hasTable('transactions') && Schema::hasColumn('transactions', 'payment_provider')) {
            Schema::table('transactions', function (Blueprint $table) {
                $table->dropColumn('payment_provider');
            });
        }
    }
};

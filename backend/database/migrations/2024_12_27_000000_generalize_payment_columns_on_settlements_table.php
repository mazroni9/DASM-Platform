<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Multi-Gateway Payment Support
     * Generalizes provider-specific columns to support multiple payment gateways.
     */
    public function up(): void
    {
        Schema::table('settlements', function (Blueprint $table) {
            // Rename clickpay_transaction_ref to generic service_fees_payment_ref
            $table->renameColumn('clickpay_transaction_ref', 'service_fees_payment_ref');
        });

        Schema::table('settlements', function (Blueprint $table) {
            // Add gateway identifier column
            $table->string('service_fees_gateway', 50)
                ->default('CLICKPAY')
                ->after('service_fees_payment_ref')
                ->comment('Payment gateway used: MOYASAR, CLICKPAY');
        });

        // Add payment_provider to transactions if not exists
        if (!Schema::hasColumn('transactions', 'payment_provider')) {
            Schema::table('transactions', function (Blueprint $table) {
                $table->string('payment_provider', 50)
                    ->nullable()
                    ->after('type')
                    ->comment('Payment gateway: MOYASAR, CLICKPAY');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('settlements', function (Blueprint $table) {
            $table->dropColumn('service_fees_gateway');
        });

        Schema::table('settlements', function (Blueprint $table) {
            $table->renameColumn('service_fees_payment_ref', 'clickpay_transaction_ref');
        });

        if (Schema::hasColumn('transactions', 'payment_provider')) {
            Schema::table('transactions', function (Blueprint $table) {
                $table->dropColumn('payment_provider');
            });
        }
    }
};

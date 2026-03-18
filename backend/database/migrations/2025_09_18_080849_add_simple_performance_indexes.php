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
        // Performance indexes for users table
        Schema::table('users', function (Blueprint $table) {
            $table->index(['role', 'kyc_status'], 'idx_users_role_kyc');
            $table->index(['email', 'phone'], 'idx_users_contact');
            $table->index('created_at', 'idx_users_created_at');
        });

        // Performance indexes for cars table
        Schema::table('cars', function (Blueprint $table) {
            $table->index(['auction_status', 'created_at'], 'idx_cars_status_created');
            $table->index(['make', 'model', 'year'], 'idx_cars_make_model_year');
            $table->index(['dealer_id', 'auction_status'], 'idx_cars_dealer_status');
            $table->index('evaluation_price', 'idx_cars_evaluation_price');
        });

        // Performance indexes for auctions table
        Schema::table('auctions', function (Blueprint $table) {
            $table->index(['status', 'start_time'], 'idx_auctions_status_start');
            $table->index(['car_id', 'status'], 'idx_auctions_car_status');
            $table->index(['start_time', 'end_time'], 'idx_auctions_time_range');
            $table->index('current_bid', 'idx_auctions_current_bid');
        });

        // Performance indexes for bids table
        Schema::table('bids', function (Blueprint $table) {
            $table->index(['auction_id', 'created_at'], 'idx_bids_auction_created');
            $table->index(['user_id', 'created_at'], 'idx_bids_user_created');
            $table->index('bid_amount', 'idx_bids_amount');
            $table->index('created_at', 'idx_bids_created_at');
        });

        // Performance indexes for wallets table
        Schema::table('wallets', function (Blueprint $table) {
            $table->index('user_id', 'idx_wallets_user');
            $table->index('available_balance', 'idx_wallets_balance');
        });

        // Performance indexes for transactions table
        Schema::table('transactions', function (Blueprint $table) {
            $table->index(['wallet_id', 'created_at'], 'idx_transactions_wallet_created');
            $table->index(['type', 'created_at'], 'idx_transactions_type_created');
            $table->index('related_auction', 'idx_transactions_auction');
        });

        // Performance indexes for settlements table
        Schema::table('settlements', function (Blueprint $table) {
            $table->index(['status', 'created_at'], 'idx_settlements_status_created');
            $table->index(['seller_id', 'status'], 'idx_settlements_seller_status');
            $table->index(['buyer_id', 'status'], 'idx_settlements_buyer_status');
            $table->index('auction_id', 'idx_settlements_auction');
        });

        // Performance indexes for notifications table
        Schema::table('notifications', function (Blueprint $table) {
            $table->index(['notifiable_type', 'notifiable_id'], 'idx_notifications_notifiable');
            $table->index(['type', 'created_at'], 'idx_notifications_type_created');
            $table->index('read_at', 'idx_notifications_read_at');
        });

        // Performance indexes for wallet_transactions table
        Schema::table('wallet_transactions', function (Blueprint $table) {
            $table->index(['wallet_id', 'created_at'], 'idx_wallet_transactions_wallet_created');
            $table->index(['type', 'status'], 'idx_wallet_transactions_type_status');
            $table->index('reference', 'idx_wallet_transactions_reference');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop indexes for users table
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('idx_users_role_kyc');
            $table->dropIndex('idx_users_contact');
            $table->dropIndex('idx_users_created_at');
        });

        // Drop indexes for cars table
        Schema::table('cars', function (Blueprint $table) {
            $table->dropIndex('idx_cars_status_created');
            $table->dropIndex('idx_cars_make_model_year');
            $table->dropIndex('idx_cars_dealer_status');
            $table->dropIndex('idx_cars_evaluation_price');
        });

        // Drop indexes for auctions table
        Schema::table('auctions', function (Blueprint $table) {
            $table->dropIndex('idx_auctions_status_start');
            $table->dropIndex('idx_auctions_car_status');
            $table->dropIndex('idx_auctions_time_range');
            $table->dropIndex('idx_auctions_current_bid');
        });

        // Drop indexes for bids table
        Schema::table('bids', function (Blueprint $table) {
            $table->dropIndex('idx_bids_auction_created');
            $table->dropIndex('idx_bids_user_created');
            $table->dropIndex('idx_bids_amount');
            $table->dropIndex('idx_bids_created_at');
        });

        // Drop indexes for wallets table
        Schema::table('wallets', function (Blueprint $table) {
            $table->dropIndex('idx_wallets_user');
            $table->dropIndex('idx_wallets_balance');
        });

        // Drop indexes for transactions table
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex('idx_transactions_wallet_created');
            $table->dropIndex('idx_transactions_type_created');
            $table->dropIndex('idx_transactions_auction');
        });

        // Drop indexes for settlements table
        Schema::table('settlements', function (Blueprint $table) {
            $table->dropIndex('idx_settlements_status_created');
            $table->dropIndex('idx_settlements_seller_status');
            $table->dropIndex('idx_settlements_buyer_status');
            $table->dropIndex('idx_settlements_auction');
        });

        // Drop indexes for notifications table
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex('idx_notifications_notifiable');
            $table->dropIndex('idx_notifications_type_created');
            $table->dropIndex('idx_notifications_read_at');
        });

        // Drop indexes for wallet_transactions table
        Schema::table('wallet_transactions', function (Blueprint $table) {
            $table->dropIndex('idx_wallet_transactions_wallet_created');
            $table->dropIndex('idx_wallet_transactions_type_status');
            $table->dropIndex('idx_wallet_transactions_reference');
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Users Table
        Schema::create('users', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('email')->unique();
            $table->string('phone', 20)->unique();
            $table->string('password_hash');
            $table->enum('role', ['buyer', 'seller', 'admin'])->default('buyer');
            $table->enum('kyc_status', ['pending', 'verified', 'rejected'])->default('pending');
            $table->timestamps();
        });

        // 2. Dealers Table
        Schema::create('dealers', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('user_id');
            $table->string('company_name');
            $table->string('cr_number', 50)->unique();
            $table->string('vat_number', 50)->unique();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        // 3. Cars Table
        Schema::create('cars', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('dealer_id');
            $table->string('make', 100);
            $table->string('model', 100);
            $table->integer('year');
            $table->string('vin', 100)->unique();
            $table->integer('odometer');
            $table->enum('condition', ['excellent', 'good', 'fair', 'poor']);
            $table->decimal('evaluation_price', 12, 2)->nullable();
            $table->enum('auction_status', ['pending', 'live', 'sold', 'expired'])->default('pending');
            $table->timestamps();

            $table->foreign('dealer_id')->references('id')->on('dealers')->onDelete('cascade');
        });

        // 4. Auctions Table
        Schema::create('auctions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('car_id');
            $table->dateTime('start_time');
            $table->dateTime('end_time');
            $table->decimal('starting_bid', 12, 2);
            $table->decimal('current_bid', 12, 2)->nullable();
            $table->enum('status', ['scheduled', 'live', 'ended', 'cancelled'])->default('scheduled');
            $table->timestamps();

            $table->foreign('car_id')->references('id')->on('cars')->onDelete('cascade');
        });

        // 5. Bids Table
        Schema::create('bids', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('auction_id');
            $table->unsignedBigInteger('user_id');
            $table->decimal('bid_amount', 12, 2);
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent();
            $table->foreign('auction_id')->references('id')->on('auctions')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        // 6. Wallets Table
        Schema::create('wallets', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('user_id');
            $table->decimal('available_balance', 12, 2)->default(0);
            $table->decimal('funded_balance', 12, 2)->default(0);
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        // 7. Transactions Table
        Schema::create('transactions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('wallet_id');
            $table->enum('type', ['deposit', 'withdrawal', 'bid', 'refund', 'settlement']);
            $table->decimal('amount', 12, 2);
            $table->unsignedBigInteger('related_auction')->nullable();
            $table->string('description')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('wallet_id')->references('id')->on('wallets')->onDelete('cascade');
        });

        // 8. Settlements Table
        Schema::create('settlements', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('auction_id');
            $table->unsignedBigInteger('seller_id'); // References dealers.id
            $table->unsignedBigInteger('buyer_id');  // References users.id
            $table->unsignedBigInteger('car_id');
            $table->decimal('final_price', 12, 2);
            $table->decimal('platform_fee', 12, 2);
            $table->decimal('tam_fee', 12, 2);
            $table->decimal('net_amount', 12, 2);
            $table->enum('status', ['pending', 'completed'])->default('pending');
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('auction_id')->references('id')->on('auctions')->onDelete('cascade');
            $table->foreign('seller_id')->references('id')->on('dealers')->onDelete('cascade');
            $table->foreign('buyer_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('car_id')->references('id')->on('cars')->onDelete('cascade');
        });

        // 9. Live Streaming Sessions Table
        Schema::create('live_streaming_sessions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('auction_id');
            $table->string('stream_url', 500);
            $table->enum('status', ['scheduled', 'live', 'ended'])->default('scheduled');
            $table->dateTime('started_at')->nullable();
            $table->dateTime('ended_at')->nullable();
            $table->timestamps();

            $table->foreign('auction_id')->references('id')->on('auctions')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('live_streaming_sessions');
        Schema::dropIfExists('settlements');
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('wallets');
        Schema::dropIfExists('bids');
        Schema::dropIfExists('auctions');
        Schema::dropIfExists('cars');
        Schema::dropIfExists('dealers');
        Schema::dropIfExists('users');
    }
};

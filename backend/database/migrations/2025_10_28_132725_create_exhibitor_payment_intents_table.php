<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('exhibitor_payment_intents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wallet_id')->constrained('exhibitor_wallets')->cascadeOnDelete();
            $table->bigInteger('amount'); // بالهللات
            $table->string('provider')->default('myfatoorah');
            $table->string('provider_ref')->nullable()->index();
            $table->enum('status', ['pending','requires_action','succeeded','cancelled','failed'])->default('pending');
            $table->string('return_url')->nullable();
            $table->string('callback_url')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('exhibitor_payment_intents');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('exhibitor_payout_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wallet_id')->constrained('exhibitor_wallets')->cascadeOnDelete();
            $table->bigInteger('amount'); // بالهللات
            $table->string('method')->default('bank_transfer');
            $table->json('details')->nullable(); // {iban, bank_name, account_name}
            $table->enum('status', ['pending','approved','rejected','paid'])->default('pending');
            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('exhibitor_payout_requests');
    }
};

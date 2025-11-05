<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('exhibitor_wallets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->bigInteger('balance')->default(0); // بالمليم/هللة: 100 = 1 SAR
            $table->string('currency', 3)->default('SAR');
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('exhibitor_wallets');
    }
};

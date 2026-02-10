<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('newsletter_subscribers', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();

            // Useful metadata
            $table->string('status')->default('subscribed'); // subscribed | unsubscribed
            $table->string('source')->nullable();            // e.g. footer, landing
            $table->ipAddress('ip')->nullable();
            $table->text('user_agent')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('newsletter_subscribers');
    }
};

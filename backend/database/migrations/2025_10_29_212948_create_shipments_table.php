<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('shipments', function (Blueprint $table) {
            $table->id();

            // مالك المعرض من جدول venue_owners
            $table->foreignId('venue_owner_id')->constrained('venue_owners')->cascadeOnDelete();

            // المشتري من جدول users
            $table->foreignId('buyer_id')->constrained('users')->cascadeOnDelete();

            // بيانات الشحن والعنوان
            $table->string('recipient_name', 120);
            $table->string('address_line', 255);
            $table->string('city', 120)->nullable();
            $table->string('region', 120)->nullable();
            $table->string('country', 3)->nullable();
            $table->string('postal_code', 20)->nullable();

            // الناقل والتتبع
            $table->string('carrier_code', 30)->nullable();      // aramex/dhl/local...
            $table->string('tracking_number', 64)->nullable();
            $table->unsignedTinyInteger('shipping_status')->default(0); // 0..3
            $table->timestamp('delivered_at')->nullable();

            // الدفع
            $table->string('payment_status', 20)->default('محجوز');

            // مساعدات للعرض
            $table->unsignedInteger('items_count')->default(0);
            $table->string('items_summary')->nullable();

            $table->timestamps();

            $table->unique(['carrier_code', 'tracking_number']);
            $table->index(['venue_owner_id', 'created_at']);
            $table->index(['buyer_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shipments');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('extra_services', function (Blueprint $table) {
            $table->id();
            $table->string('name');                  // اسم الخدمة
            $table->string('description')->nullable();
            $table->text('details')->nullable();
            $table->string('icon')->nullable();      // مفتاح أيقونة للفرونت
            $table->decimal('base_price', 10, 2)->default(0);
            $table->string('currency', 8)->default('SAR');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('extra_services');
    }
};

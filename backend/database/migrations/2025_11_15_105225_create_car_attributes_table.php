<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('car_attributes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('car_id')
                ->constrained('cars')
                ->onDelete('cascade');

            // اسم الخاصية (option) مثلاً: usage_type, length_m, has_bathroom
            $table->string('key', 100);

            // القيمة كـ string (ممكن تخزن أرقام/booleans كنص)
            $table->string('value', 255)->nullable();

            $table->timestamps();

            $table->unique(['car_id', 'key']); // كل خاصية مرة واحدة لكل سيارة
            $table->index(['car_id', 'key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('car_attributes');
    }
};

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
        // أنشئ الجدول فقط لو مش موجود
        if (! Schema::hasTable('car_report_images')) {
            Schema::create('car_report_images', function (Blueprint $table) {
                $table->id();
                $table->foreignId('car_id')
                    ->constrained('cars')
                    ->cascadeOnDelete();

                $table->string('image_path'); // مسار الصورة
                $table->integer('file_size'); // بالحجم بالبايت (integer كافي على Postgres)

                // فهارس مفيدة للاستعلام
                $table->index('car_id');

                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('car_report_images');
    }
};

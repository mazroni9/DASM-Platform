<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('venue_owner_reviews', function (Blueprint $table) {
            $table->id();

            // مكان التقييم: صاحب المعرض
            $table->foreignId('venue_owner_id')->constrained('venue_owners')->cascadeOnDelete();

            // من قام بالمراجعة (العميل)
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();

            // التقييم 1..5 بدقة منزلتين (مثل 4.50)
            $table->decimal('rating', 3, 2);

            // تعليق اختياري
            $table->text('comment')->nullable();

            // هل المراجعة مُعتمدة من الإدارة؟ (للسماح بالمراجعة قبل الظهور)
            $table->boolean('is_approved')->default(true);

            // هل المراجع “مُتحقق/Verified” (اختياري)
            $table->boolean('verified')->default(false);

            $table->timestamps();

            // لا يُسمح للمستخدم أن يقيّم نفس صاحب المعرض أكثر من مرة
            $table->unique(['venue_owner_id', 'user_id']);
            // فهارس للاستعلامات
            $table->index(['venue_owner_id', 'is_approved']);
        });
    }

    public function down(): void {
        Schema::dropIfExists('venue_owner_reviews');
    }
};

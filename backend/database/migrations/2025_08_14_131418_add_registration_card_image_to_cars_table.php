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
        // أضف العمود فقط إذا غير موجود
        if (! Schema::hasColumn('cars', 'registration_card_image')) {
            Schema::table('cars', function (Blueprint $table) {
                $table->string('registration_card_image')->nullable();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // احذف العمود فقط إذا موجود
        if (Schema::hasColumn('cars', 'registration_card_image')) {
            Schema::table('cars', function (Blueprint $table) {
                $table->dropColumn('registration_card_image');
            });
        }
    }
};

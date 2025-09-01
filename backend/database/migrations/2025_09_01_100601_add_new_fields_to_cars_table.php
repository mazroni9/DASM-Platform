<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('cars', function (Blueprint $table) {
            // أضف الأعمدة الجديدة فقط إذا لم تكن موجودة بالفعل
            if (!Schema::hasColumn('cars', 'car_type')) {
                $table->string('car_type')->nullable();
            }
            if (!Schema::hasColumn('cars', 'fuel_type')) {
                $table->string('fuel_type')->nullable();
            }
            if (!Schema::hasColumn('cars', 'engine_size')) {
                $table->string('engine_size')->nullable();
            }
            if (!Schema::hasColumn('cars', 'doors')) {
                $table->string('doors')->nullable();
            }
            if (!Schema::hasColumn('cars', 'features')) {
                $table->json('features')->nullable();
            }
            if (!Schema::hasColumn('cars', 'auction_start_price')) {
                $table->decimal('auction_start_price', 12, 2)->nullable();
            }
            if (!Schema::hasColumn('cars', 'auction_min_price')) {
                $table->decimal('auction_min_price', 12, 2)->nullable();
            }
            if (!Schema::hasColumn('cars', 'auction_max_price')) {
                $table->decimal('auction_max_price', 12, 2)->nullable();
            }
            if (!Schema::hasColumn('cars', 'auction_start_date')) {
                $table->datetime('auction_start_date')->nullable();
            }
            if (!Schema::hasColumn('cars', 'auction_end_date')) {
                $table->datetime('auction_end_date')->nullable();
            }
            if (!Schema::hasColumn('cars', 'city')) {
                $table->string('city')->nullable();
            }
        });
    }

    public function down()
    {
        Schema::table('cars', function (Blueprint $table) {
            // احذف الأعمدة فقط إذا كانت موجودة
            if (Schema::hasColumn('cars', 'car_type')) {
                $table->dropColumn('car_type');
            }
            if (Schema::hasColumn('cars', 'fuel_type')) {
                $table->dropColumn('fuel_type');
            }
            if (Schema::hasColumn('cars', 'engine_size')) {
                $table->dropColumn('engine_size');
            }
            if (Schema::hasColumn('cars', 'doors')) {
                $table->dropColumn('doors');
            }
            if (Schema::hasColumn('cars', 'features')) {
                $table->dropColumn('features');
            }
            if (Schema::hasColumn('cars', 'auction_start_price')) {
                $table->dropColumn('auction_start_price');
            }
            if (Schema::hasColumn('cars', 'auction_min_price')) {
                $table->dropColumn('auction_min_price');
            }
            if (Schema::hasColumn('cars', 'auction_max_price')) {
                $table->dropColumn('auction_max_price');
            }
            if (Schema::hasColumn('cars', 'auction_start_date')) {
                $table->dropColumn('auction_start_date');
            }
            if (Schema::hasColumn('cars', 'auction_end_date')) {
                $table->dropColumn('auction_end_date');
            }
            if (Schema::hasColumn('cars', 'city')) {
                $table->dropColumn('city');
            }
        });
    }
};

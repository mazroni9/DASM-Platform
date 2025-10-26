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
        Schema::table('settlements', function (Blueprint $table) {
            $table->decimal('muroor_fee', 10, 2)->nullable();
            $table->decimal('myfatoorah_fee', 10, 2)->nullable();
            $table->decimal('buyer_net_amount', 10, 2)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('settlements', function (Blueprint $table) {
            $table->dropColumn('muroor_fee');
            $table->dropColumn('myfatoorah_fee');
            $table->dropColumn('buyer_net_amount');
        });
    }
};

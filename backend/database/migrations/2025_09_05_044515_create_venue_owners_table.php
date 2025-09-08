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
        Schema::create('venue_owners', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('user_id');
            $table->string('venue_name');
            $table->string('cr_number', 50)->unique();
            $table->string('vat_number', 50)->nullable();
            $table->text('description')->nullable();
            $table->enum('status', ['pending', 'active', 'rejected'])->default('pending');
            $table->boolean('is_active')->default(false);
            $table->decimal('rating', 3, 2)->default(0);
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('venue_owners');
    }
};
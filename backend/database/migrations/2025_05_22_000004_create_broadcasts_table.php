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
        Schema::create('broadcasts', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('venue_id')->constrained()->onDelete('cascade');
            $table->boolean('is_live')->default(false);
            $table->string('youtube_stream_id')->nullable();
            $table->string('youtube_embed_url')->nullable();
            $table->string('youtube_chat_embed_url')->nullable();
            $table->timestamp('scheduled_start_time')->nullable();
            $table->timestamp('actual_start_time')->nullable();
            $table->timestamp('end_time')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('broadcasts');
    }
};
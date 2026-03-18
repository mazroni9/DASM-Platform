<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('youtube_channels', function (Blueprint $table) {
            $table->id();

            // لو عندك Multi-tenant على organizations
            $table->unsignedBigInteger('organization_id')->nullable()->index();

            $table->string('name');
            $table->string('channel_id')->index();

            $table->unsignedBigInteger('subscriber_count')->default(0);
            $table->unsignedBigInteger('video_count')->default(0);
            $table->timestamp('last_video_date')->nullable();

            $table->boolean('is_active')->default(true);

            $table->unsignedBigInteger('created_by')->nullable()->index();

            $table->timestamps();

            // Unique per organization (لو مفيش org يخزن NULL)
            $table->unique(['organization_id', 'channel_id'], 'yt_channels_org_channel_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('youtube_channels');
    }
};

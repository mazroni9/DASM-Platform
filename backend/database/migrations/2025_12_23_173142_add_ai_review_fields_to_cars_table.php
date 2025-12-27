<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('cars', function (Blueprint $table) {
            $table->string('review_status')->default('pending')->after('auction_status');
            $table->uuid('review_request_id')->nullable()->unique()->after('review_status');
            $table->float('review_score')->nullable()->after('review_request_id'); // 0..100
            $table->json('review_details')->nullable()->after('review_score');
            $table->text('review_reason')->nullable()->after('review_details');
            $table->timestamp('reviewed_at')->nullable()->after('review_reason');

            $table->index('review_status');
        });
    }

    public function down(): void
    {
        Schema::table('cars', function (Blueprint $table) {
            $table->dropIndex(['review_status']);
            $table->dropColumn([
                'review_status',
                'review_request_id',
                'review_score',
                'review_details',
                'review_reason',
                'reviewed_at',
            ]);
        });
    }
};

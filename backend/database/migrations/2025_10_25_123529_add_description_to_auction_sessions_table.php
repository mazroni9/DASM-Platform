<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('auction_sessions', function (Blueprint $table) {
            if (!Schema::hasColumn('auction_sessions', 'description')) {
                $table->text('description')->nullable()->after('type');
            }
        });
    }

    public function down(): void
    {
        Schema::table('auction_sessions', function (Blueprint $table) {
            if (Schema::hasColumn('auction_sessions', 'description')) {
                $table->dropColumn('description');
            }
        });
    }
};

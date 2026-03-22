<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('bid_sensitive_context_logs')) {
            return;
        }

        Schema::table('bid_sensitive_context_logs', function (Blueprint $table) {
            $table->string('online_status', 16)->nullable()->after('user_agent');
            $table->string('network_effective_type', 32)->nullable()->after('online_status');
            $table->decimal('network_downlink', 8, 2)->nullable()->after('network_effective_type');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('bid_sensitive_context_logs')) {
            return;
        }

        Schema::table('bid_sensitive_context_logs', function (Blueprint $table) {
            $table->dropColumn(['online_status', 'network_effective_type', 'network_downlink']);
        });
    }
};

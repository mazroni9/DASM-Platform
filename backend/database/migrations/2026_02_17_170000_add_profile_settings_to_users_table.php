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
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'avatar_url')) {
                $table->string('avatar_url')->nullable()->after('organization_id');
            }

            if (!Schema::hasColumn('users', 'two_factor_auth')) {
                $table->boolean('two_factor_auth')->default(false)->after('avatar_url');
            }

            if (!Schema::hasColumn('users', 'notification_email')) {
                $table->boolean('notification_email')->default(true)->after('two_factor_auth');
            }

            if (!Schema::hasColumn('users', 'notification_sms')) {
                $table->boolean('notification_sms')->default(false)->after('notification_email');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'notification_sms')) {
                $table->dropColumn('notification_sms');
            }

            if (Schema::hasColumn('users', 'notification_email')) {
                $table->dropColumn('notification_email');
            }

            if (Schema::hasColumn('users', 'two_factor_auth')) {
                $table->dropColumn('two_factor_auth');
            }

            if (Schema::hasColumn('users', 'avatar_url')) {
                $table->dropColumn('avatar_url');
            }
        });
    }
};


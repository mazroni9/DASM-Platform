<?php
// database/migrations/2025_01_01_000000_add_user_id_to_auction_sessions_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('auction_sessions', function (Blueprint $table) {
            $table->foreignId('user_id')
                  ->nullable()
                  ->after('id')
                  ->constrained('users')
                  ->nullOnDelete(); // لو اتلغى المستخدم نخليها NULL
            $table->index('user_id');
        });
    }

    public function down(): void {
        Schema::table('auction_sessions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_id');
        });
    }
};

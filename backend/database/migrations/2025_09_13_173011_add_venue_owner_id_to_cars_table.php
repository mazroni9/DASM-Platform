<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddVenueOwnerIdToCarsTable extends Migration
{
    public function up()
    {
        Schema::table('cars', function (Blueprint $table) {
            // نضيف العمود
            $table->unsignedBigInteger('venue_owner_id')->nullable()->after('dealer_id');

            // نربطه بـ venue_owners.user_id (وليس id)
            $table->foreign('venue_owner_id')
                  ->references('user_id')
                  ->on('venue_owners')
                  ->onDelete('set null'); // أو 'cascade' حسب ما يناسبك
        });
    }

    public function down()
    {
        Schema::table('cars', function (Blueprint $table) {
            $table->dropForeign(['venue_owner_id']);
            $table->dropColumn('venue_owner_id');
        });
    }
}

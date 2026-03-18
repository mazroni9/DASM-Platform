<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddUniqueConstraintToUserIdInVenueOwners extends Migration
{
    public function up()
    {
        Schema::table('venue_owners', function (Blueprint $table) {
            $table->unique('user_id');
        });
    }

    public function down()
    {
        Schema::table('venue_owners', function (Blueprint $table) {
            $table->dropUnique(['user_id']);
        });
    }
}

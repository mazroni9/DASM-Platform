<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // make/model case-insensitive + year
        DB::statement("CREATE INDEX IF NOT EXISTS idx_cars_make_model_year ON cars ((lower(make)), (lower(model)), year)");
        // فهرس للسعر (evaluation_price)
        DB::statement("CREATE INDEX IF NOT EXISTS idx_cars_eval_price ON cars (evaluation_price)");
        // فهرس للممشى لو هتستخدمه
        DB::statement("CREATE INDEX IF NOT EXISTS idx_cars_odometer ON cars (odometer)");
    }
    public function down(): void
    {
        DB::statement("DROP INDEX IF EXISTS idx_cars_make_model_year");
        DB::statement("DROP INDEX IF EXISTS idx_cars_eval_price");
        DB::statement("DROP INDEX IF EXISTS idx_cars_odometer");
    }
};

<?php

namespace App\Http\Controllers;

use App\Enums\UserStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class HomeStatsController extends Controller
{
    public function __invoke(): JsonResponse
    {
        // ✅ كاش سريع لتخفيف الضغط (60 ثانية)
        $data = Cache::remember('home_stats:v1', 60, function () {

            $carsCount = (int) DB::table('cars')->count();

            // ✅ المستخدمين النشطين
            $activeUsersCount = (int) DB::table('users')
                ->where('is_active', true)
                ->where('status', UserStatus::ACTIVE->value)
                ->count();

            return [
                'cars_count' => $carsCount,
                'active_users_count' => $activeUsersCount,
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => $data,
        ]);
    }
}

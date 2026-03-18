<?php

namespace App\Http\Controllers;

use App\Http\Requests\CheckTimeRequest;
use Carbon\Carbon;

class CheckTimeController extends Controller
{
    public function check(CheckTimeRequest $request)
    {
        $page = (string) $request->validated()['page'];

        // نفس ranges بتاعتك
        $pageTimeRanges = [
            'live_auction' => [
                ['start' => '16:00:00', 'end' => '18:59:59'],
            ],
            'instant_auction' => [
                ['start' => '19:00:00', 'end' => '21:59:59'],
            ],
            'late_auction' => [
                ['start' => '22:00:00', 'end' => '15:59:59'], // overnight
            ],
        ];

        // نخليها +3 زي ما انت عامل (من غير لعب)
        $tz = 'Asia/Riyadh';
        $now = Carbon::now($tz);

        $isAllowed = false;
        $remainingSeconds = null;

        foreach ($pageTimeRanges[$page] as $range) {
            $start = Carbon::createFromFormat('H:i:s', $range['start'], $tz)->setDate($now->year, $now->month, $now->day);
            $end   = Carbon::createFromFormat('H:i:s', $range['end'],   $tz)->setDate($now->year, $now->month, $now->day);

            // overnight support
            if ($end->lessThanOrEqualTo($start)) {
                if ($now->lessThan($end)) {
                    $start->subDay();
                } else {
                    $end->addDay();
                }
            }

            if ($now->between($start, $end)) {
                $isAllowed = true;
                $remainingSeconds = $now->diffInSeconds($end);
                break;
            }
        }

        return response()->json([
            'page' => $page,
            'current_time' => $now->format('H:i:s'),
            'allowed' => $isAllowed,
            'remaining_seconds' => $remainingSeconds,
            'remaining_time' => $remainingSeconds ? gmdate('H:i:s', $remainingSeconds) : null,
            'timezone' => 'GMT+3',
        ]);
    }
}

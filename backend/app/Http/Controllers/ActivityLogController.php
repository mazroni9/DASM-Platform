<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Spatie\Activitylog\Models\Activity;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $activities = Activity::with(['causer', 'subject'])->latest()->paginate($request->get('per_page', 20));
        return response()->json($activities);
    }
}

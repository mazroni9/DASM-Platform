<?php

namespace App\Http\Controllers\Admin;

use App\Models\BidEvent;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class BidEventController extends Controller
{
    public function index(Request $request){
        $bids_logs = BidEvent::with('auction', 'bidder')
        ->orderBy('server_ts_utc', 'desc')
        ->paginate(15);

        return response()->json([
            'status' => 'success',
            'data' => $bids_logs,
            'pagination' => [
                'total' => $bids_logs->total(),
                'per_page' => $bids_logs->perPage(),
                'current_page' => $bids_logs->currentPage(),
                'last_page' => $bids_logs->lastPage()
            ]
        ]);
    }

    public  function show($id){
        $bid_event = BidEvent::with('auction', 'bidder')->find($id);
        return response()->json([
            'status' => 'success',
            'data' => $bid_event
        ]);
    }
}

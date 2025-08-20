<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\DeviceToken;

class DeviceTokenController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
        ]);
        DeviceToken::updateOrCreate([
            'token' => $request->token,
        ],[
            'token' => $request->token,
            'user_id' => $request->user()->id
        ]);
        // $request->user()->deviceTokens()->updateOrCreate(
        //     ['token' => $request->token],
        //     ['user_id' => $request->user()->id]
        // );

        return response()->json(['success' => true]);
    }
}

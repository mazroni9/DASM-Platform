<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    public function index(Request $request)
    {

        //return $user=Auth::user();
        $unreadNotifications = $request->user()->unreadNotifications->count();
        $notifications = $request->user()->notifications->sortByDesc('created_at')->take(10);

        $notifications = $notifications->map(function ($notification) {
            return [
                'id' => $notification->id,
                'title' => $notification->data['title'],
                'body' => $notification->data['body'],
                'action' => $notification->data['action'],
                'read_at' => $notification->read_at,
                'created_at' => $notification->created_at,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => [
                'notifications' => $notifications,
                'unreadNotificationsCount' => $unreadNotifications
            ]
        ]);
    }
}

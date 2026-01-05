<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Get all notifications for the authenticated user.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $unreadNotifications = $request->user()->unreadNotifications->count();
        $notifications = $request->user()->notifications->sortByDesc('created_at')->take(10);

        $notifications = $notifications->map(function ($notification) {
            return [
                'id' => $notification->id,
                'title' => $notification->data['title'] ?? 'إشعار جديد',
                'body' => $notification->data['body'] ?? '',
                'icon' => $notification->data['icon'] ?? null,
                'color' => $notification->data['color'] ?? null,
                'action' => $notification->data['action'] ?? null,
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

    /**
     * Get unread notifications count.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function unreadCount(Request $request)
    {
        $count = $request->user()->unreadNotifications()->count();

        return response()->json([
            'status' => 'success',
            'data' => [
                'unread_count' => $count
            ]
        ]);
    }

    /**
     * Mark a single notification as read.
     *
     * @param Request $request
     * @param string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function markAsRead(Request $request, string $id)
    {
        $notification = $request->user()->notifications()->where('id', $id)->first();

        if (!$notification) {
            return response()->json([
                'status' => 'error',
                'message' => 'الإشعار غير موجود'
            ], 404);
        }

        $notification->markAsRead();

        return response()->json([
            'status' => 'success',
            'message' => 'تم تحديد الإشعار كمقروء'
        ]);
    }

    /**
     * Mark all notifications as read.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function markAllAsRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json([
            'status' => 'success',
            'message' => 'تم تحديد جميع الإشعارات كمقروءة'
        ]);
    }
}

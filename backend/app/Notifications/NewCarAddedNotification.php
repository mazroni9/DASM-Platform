<?php

namespace App\Notifications;

use App\Models\Car;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;

class NewCarAddedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public bool $afterCommit = true;

    public function __construct(public Car $car)
    {
    }

    public function via(object $notifiable): array
    {
        return [FcmChannel::class, 'database'];
    }

    public function toFcm($notifiable): FcmMessage
    {
        $userName = $this->car->user?->name ?? 'مستخدم';
        $img = null;

        try {
            $imgs = is_array($this->car->images) ? $this->car->images : [];
            $img = $imgs[0] ?? null;
        } catch (\Throwable $e) {
            $img = null;
        }

        $img = $img ?: asset('assets/images/logo.jpg');

        return (new FcmMessage(notification: new FcmNotification(
            title: 'سيارة جديدة بانتظار المراجعة',
            body: "تم إضافة سيارة جديدة ({$this->car->make} {$this->car->model}) من قبل المستخدم {$userName}.",
            image: $img
        )))
            ->data(['car_id' => (string)$this->car->id, 'user_id' => (string)$this->car->user_id, 'icon' => 'car', 'color' => 'slate'])
            ->custom([
                "webpush" => [
                    "headers" => ["Urgency" => "high"],
                    'fcm_options' => [
                        "link" => "/admin/cars/{$this->car->id}",
                    ]
                ],
                'android' => [
                    'notification' => [
                        'color' => '#0A0A0A',
                        'sound' => 'default',
                    ],
                ],
                'apns' => [
                    'payload' => [
                        'aps' => [
                            'sound' => 'default'
                        ],
                    ],
                ],
            ]);
    }

    public function toArray(object $notifiable): array
    {
        $userName = $this->car->user?->name ?? 'مستخدم';

        return [
            'title' => 'سيارة جديدة بانتظار المراجعة',
            'body' => "تم إضافة سيارة جديدة ({$this->car->make} {$this->car->model}) من قبل المستخدم {$this->car->user->name}.",
            'icon' => 'car',
            'color' => 'slate',
            'data' => [
                'car_id' => $this->car->id,
                'user_id' => $this->car->user_id,
                'type' => 'new_car_added',
            ],
            'action' => [
                'type' => 'VIEW_CAR_DETAILS',
                'route_name' => '/admin/cars/[car_id]',
                'route_params' => [
                    'car_id' => $this->car->id
                ]
            ]
        ];
    }
}

<?php

namespace App\Notifications;

use App\Models\Car;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;

class CarDetailsUpdatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Car $car)
    {
        $this->afterCommit = true;
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
            $img = is_array($this->car->images) ? ($this->car->images[0] ?? null) : null;
        } catch (\Throwable $e) {
            $img = null;
        }
        $img = $img ?: asset('assets/images/logo.jpg');

        return (new FcmMessage(notification: new FcmNotification(
            title: 'تم تحديث بيانات السيارة',
            body: "قام المستخدم {$userName} بتحديث بيانات السيارة ({$this->car->make} {$this->car->model}). يرجى المراجعة.",
            image: $img
        )))
            ->data(['car_id' => (string)$this->car->id, 'user_id' => (string)$this->car->user_id, 'icon' => 'edit', 'color' => 'blue'])
            ->custom([
                "webpush" => [
                    "headers" => ["Urgency" => "high"],
                    'fcm_options' => [
                        "link" => "/admin/cars/{$this->car->id}",
                    ]
                ]
            ]);
    }

    public function toArray(object $notifiable): array
    {
        $userName = $this->car->user?->name ?? 'مستخدم';

        return [
            'title' => 'تم تحديث بيانات السيارة',
            'body' => "قام المستخدم {$userName} بتحديث بيانات السيارة ({$this->car->make} {$this->car->model}). يرجى المراجعة.",
            'icon' => 'edit',
            'color' => 'blue',
            'data' => [
                'car_id' => $this->car->id,
                'user_id' => $this->car->user_id,
                'type' => 'car_updated',
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

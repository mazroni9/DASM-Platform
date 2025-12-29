<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Car;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;

class NewCarAddedNotification extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public Car $car)
    {
        //
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return [FcmChannel::class, 'database'];
    }

    /**
     * Get the FCM representation of the notification.
     */
    public function toFcm($notifiable): FcmMessage
    {
        return (new FcmMessage(notification: new FcmNotification(
            title: 'سيارة جديدة بانتظار المراجعة',
            body: "تم إضافة سيارة جديدة ({$this->car->make} {$this->car->model}) من قبل المستخدم {$this->car->user->name}.",
            image: $this->car->images[0] ?? asset('assets/images/logo.jpg')
        )))
            ->data(['car_id' => (string)$this->car->id, 'user_id' => (string)$this->car->user_id, 'icon' => 'car', 'color' => 'slate'])
            ->custom([
                "webpush" => [
                    "headers" => [
                        "Urgency" => "high"
                    ],
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


    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
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

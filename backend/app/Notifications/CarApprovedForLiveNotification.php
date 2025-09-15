<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;

class CarApprovedForLiveNotification extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public $car, public $auction)
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
            title: 'تمت الموافقة على سيارتك للمزاد المباشر!',
            body: 'تمت الموافقة على سيارتك ' . $this->car->make . ' ' . $this->car->model . ' (' . $this->car->year . ') للدخول في المزاد المباشر. السيارة الآن مؤهلة للبث المباشر ويمكن للعملاء المزايدة عليها.',
            image: asset('assets/images/logo.jpg')
        )))
            ->data([
                'car_id' => (string) $this->car->id,
                'auction_id' => (string) $this->auction->id,
                'type' => 'car_approved_for_live',
            ])
            ->custom([
                "webpush" => [
                    "headers" => [
                        "Urgency" => "high"
                    ],
                    'fcm_options' => [
                        "link" => "/carDetails/" . $this->car->id,
                    ]
                ],
                'android' => [
                    'notification' => [
                        'color' => '#0A0A0A',
                        'sound' => 'default',
                    ],
                    'fcm_options' => [
                        'analytics_label' => 'analytics',
                    ],
                ],
                'apns' => [
                    'payload' => [
                        'aps' => [
                            'sound' => 'default'
                        ],
                    ],
                    'fcm_options' => [
                        'analytics_label' => 'analytics',
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
            'title' => 'تمت الموافقة على سيارتك للمزاد المباشر',
            'body' => 'تمت الموافقة على سيارتك ' . $this->car->make . ' ' . $this->car->model . ' (' . $this->car->year . ') للدخول في المزاد المباشر. السيارة الآن مؤهلة للبث المباشر ويمكن للعملاء المزايدة عليها.',
            'data' => [
                'car_id' => $this->car->id,
                'auction_id' => $this->auction->id,
                'type' => 'car_approved_for_live',
            ],
            'action' => [
                'type' => 'VIEW_CAR_DETAILS',
                'route_name' => '/carDetails/[car_id]',
                'route_params' => [
                    'car_id' => $this->car->id
                ]
            ]
        ];
    }
}

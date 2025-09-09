<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;

class CarApprovedForAuctionNotification extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public $car, public $auction = null)
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
            title: 'تم الموافقة على سيارتك للمزاد!',
            body: 'تم الموافقة على سيارتك ' . $this->car->make . ' ' . $this->car->model . ' (' . $this->car->year . ') للدخول في المزاد. يمكنك الآن متابعة حالة المزاد.',
            image: asset('assets/images/logo.jpg')
        )))
            ->data([
                'car_id' => (string) $this->car->id,
                'auction_id' => $this->auction ? (string) $this->auction->id : null,
                'type' => 'car_approved_for_auction',
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
            'title' => 'تم الموافقة على سيارتك للمزاد',
            'body' => 'تم الموافقة على سيارتك ' . $this->car->make . ' ' . $this->car->model . ' (' . $this->car->year . ') للدخول في المزاد. يمكنك الآن متابعة حالة المزاد.',
            'data' => [
                'car_id' => $this->car->id,
                'auction_id' => $this->auction ? $this->auction->id : null,
                'type' => 'car_approved_for_auction',
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

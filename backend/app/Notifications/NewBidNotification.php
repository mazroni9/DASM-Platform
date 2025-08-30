<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;

class NewBidNotification extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public $auction)
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

    public function toFcm($notifiable): FcmMessage
    {
        return (new FcmMessage(notification: new FcmNotification(
            title: 'مزايدة جديدة!',
            body: 'تم وضع مزايدة جديدة على سيارتك ' . $this->auction->car->make . ' ' . $this->auction->car->model . ' بمبلغ ' . $this->auction->current_bid,
            image: asset('assets/images/logo.jpg')
        )))
            ->data([
                'car_id' => (string) $this->auction->car_id,
                'auction_id' => (string)$this->auction->id,
                'type' => 'new_bid',
            ])
            ->custom([
                "webpush" => [
                    "headers" => [
                        "Urgency" => "high"
                    ],
                    'fcm_options' => [
                        "link" => "/carDetails/" . $this->auction->car_id,
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
            'title' => 'مزايدة جديدة',
            'body' => 'تم وضع مزايدة جديدة على سيارتك ' . $this->auction->car->make . ' ' . $this->auction->car->model . ' بمبلغ ' . $this->auction->current_bid,
            'data' => [
                'car_id' => $this->auction->car_id,
                'auction_id' => $this->auction->id,
                'type' => 'new_bid',
            ],
            'action' => [
                'type' => 'VIEW_CAR_DETAILS',
                'route_name' => '/carDetails/[car_id]',
                'route_params' => [
                    'car_id' => $this->auction->car_id
                ]
            ]
        ];
    }
}

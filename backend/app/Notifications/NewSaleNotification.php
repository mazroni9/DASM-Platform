<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;

class NewSaleNotification extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public $settlements)
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
            title: 'لقد فزت بالمزاد!',
            body: 'قام البائع بتأكيد فوزك. اضغط هنا لإكمال الدفع واستلام سيارتك.',
            image: asset('assets/images/logo.jpg')
        )))
            ->data(['car_id' => (string)$this->settlements?->car_id, 'auction_id' => (string)  $this->settlements?->auction_id])
            ->custom([
                "webpush" => [
                    "headers" => [
                        "Urgency" => "high"
                    ],
                    'fcm_options' => [
                        "link" => "/auctions/purchase-confirmation/{$this->settlements?->auction_id}",
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
            'title' => 'لقد فزت بالمزاد!',
            'body' => 'قام البائع بتأكيد فوزك. اضغط هنا لإكمال الدفع واستلام سيارتك.',
            'data' => [
                'car_id' => $this->settlements?->car_id,
                'auction_id' => $this->settlements?->auction_id,
                'type' => 'new_sale',
            ],
            'action' => [
                'type' => 'VIEW_CAR_DETAILS',
                'route_name' => '/auctions/purchase-confirmation/[auction_id]',
                'route_params' => [
                    'auction_id' => $this->settlements->auction_id
                ]
            ]
        ];
    }
}

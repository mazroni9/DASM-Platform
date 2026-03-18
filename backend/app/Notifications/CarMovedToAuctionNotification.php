<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;

class CarMovedToAuctionNotification extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public $car, public $auction, public $auctionType)
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
        $auctionTypeLabels = [
            'active' => 'المزاد النشط',
            'instant' => 'المزاد الفوري',
            'late' => 'المزاد المتأخر',
            'live' => 'المزاد المباشر',
            'pending' => 'في الانتظار'
        ];

        $auctionLabel = $auctionTypeLabels[$this->auctionType] ?? 'مزاد جديد';

        return (new FcmMessage(notification: new FcmNotification(
            title: 'تم نقل سيارتك إلى مزاد جديد!',
            body: 'تم نقل سيارتك ' . $this->car->make . ' ' . $this->car->model . ' (' . $this->car->year . ') إلى ' . $auctionLabel . '. يمكنك متابعة حالة المزاد الآن.',
            image: asset('assets/images/logo.jpg')
        )))
            ->data([
                'car_id' => (string) $this->car->id,
                'auction_id' => (string) $this->auction->id,
                'auction_type' => $this->auctionType,
                'type' => 'car_moved_to_auction',
                'icon' => 'arrow-right-circle',
                'color' => 'blue',
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
        $auctionTypeLabels = [
            'active' => 'المزاد النشط',
            'instant' => 'المزاد الفوري',
            'late' => 'المزاد المتأخر',
            'live' => 'المزاد المباشر',
            'pending' => 'في الانتظار'
        ];

        $auctionLabel = $auctionTypeLabels[$this->auctionType] ?? 'مزاد جديد';

        return [
            'title' => 'تم نقل سيارتك إلى مزاد جديد',
            'body' => 'تم نقل سيارتك ' . $this->car->make . ' ' . $this->car->model . ' (' . $this->car->year . ') إلى ' . $auctionLabel . '. يمكنك متابعة حالة المزاد الآن.',
            'icon' => 'arrow-right-circle',
            'color' => 'blue',
            'data' => [
                'car_id' => $this->car->id,
                'auction_id' => $this->auction->id,
                'auction_type' => $this->auctionType,
                'type' => 'car_moved_to_auction',
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

<?php

namespace App\Notifications;

use App\Models\Auction;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;

class CarApprovedForLiveNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public Auction $auction;

    public function __construct(Auction $auction)
    {
        $this->auction = $auction;
    }

    public function via($notifiable): array
    {
        $channels = ['database'];
        
        if ($notifiable->email) {
            $channels[] = 'mail';
        }
        
        if ($notifiable->deviceTokens()->exists()) {
            $channels[] = FcmChannel::class;
        }

        return $channels;
    }

    public function toMail($notifiable): MailMessage
    {
        $car = $this->auction->car;
        $carName = $car ? "{$car->make} {$car->model} {$car->year}" : 'سيارتك';

        return (new MailMessage)
            ->subject('تمت الموافقة على سيارتك للبث المباشر')
            ->greeting("مرحباً {$notifiable->first_name}")
            ->line("تمت الموافقة على {$carName} للمشاركة في المزاد المباشر.")
            ->line("سعر الافتتاح: {$this->auction->opening_price} ريال")
            ->action('عرض المزاد', url("/auctions/{$this->auction->id}"))
            ->line('شكراً لاستخدامك منصتنا!');
    }

    public function toFcm($notifiable): FcmMessage
    {
        $car = $this->auction->car;
        $carName = $car ? "{$car->make} {$car->model}" : 'سيارتك';

        return FcmMessage::create()
            ->setNotification(
                FcmNotification::create()
                    ->setTitle('تمت الموافقة على سيارتك')
                    ->setBody("تمت الموافقة على {$carName} للمزاد المباشر")
            )
            ->setData([
                'type'       => 'car_approved_for_live',
                'auction_id' => (string) $this->auction->id,
                'type' => 'car_approved_for_live',
                'icon' => 'radio',
                'color' => 'violet',
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

    public function toArray($notifiable): array
    {
        $car = $this->auction->car;

        return [
            'title' => 'تمت الموافقة على سيارتك للمزاد المباشر',
            'body' => 'تمت الموافقة على سيارتك ' . $this->car->make . ' ' . $this->car->model . ' (' . $this->car->year . ') للدخول في المزاد المباشر. السيارة الآن مؤهلة للبث المباشر ويمكن للعملاء المزايدة عليها.',
            'icon' => 'radio',
            'color' => 'violet',
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

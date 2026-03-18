<?php

namespace App\Notifications;

use App\Models\Settlement;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;

class NewSaleConfirmedNotification extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public Settlement $settlement)
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
        $carName = $this->settlement->car?->name ?? 'سيارة';
        $price = number_format($this->settlement->final_price, 0);

        return (new FcmMessage(notification: new FcmNotification(
            title: 'تم تأكيد عملية بيع جديدة',
            body: "تم بيع {$carName} بسعر {$price} ر.س. يرجى متابعة المدفوعات.",
            image: asset('assets/images/logo.jpg')
        )))
            ->data([
                'settlement_id' => (string)$this->settlement->id,
                'auction_id' => (string)$this->settlement->auction_id,
                'car_id' => (string)$this->settlement->car_id,
                'icon' => 'banknote',
                'color' => 'emerald',
            ])
            ->custom([
                "webpush" => [
                    "headers" => [
                        "Urgency" => "high"
                    ],
                    'fcm_options' => [
                        "link" => "/admin/sales/{$this->settlement->id}",
                    ]
                ],
                'android' => [
                    'notification' => [
                        'color' => '#10B981',
                        'sound' => 'default',
                    ],
                    'fcm_options' => [
                        'analytics_label' => 'admin_sale_confirmed',
                    ],
                ],
                'apns' => [
                    'payload' => [
                        'aps' => [
                            'sound' => 'default'
                        ],
                    ],
                    'fcm_options' => [
                        'analytics_label' => 'admin_sale_confirmed',
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
        $carName = $this->settlement->car?->name ?? 'سيارة';
        $price = number_format($this->settlement->final_price, 0);

        return [
            'title' => 'تم تأكيد عملية بيع جديدة',
            'body' => "تم بيع {$carName} بسعر {$price} ر.س. يرجى متابعة المدفوعات.",
            'icon' => 'banknote',
            'color' => 'emerald',
            'data' => [
                'settlement_id' => $this->settlement->id,
                'auction_id' => $this->settlement->auction_id,
                'car_id' => $this->settlement->car_id,
                'type' => 'sale_confirmed_admin',
                'commission' => $this->settlement->platform_fee,
                'car_price' => $this->settlement->final_price,
            ],
            'action' => [
                'type' => 'VIEW_SALE_DETAILS',
                'route_name' => '/admin/sales/[settlement_id]',
                'route_params' => [
                    'settlement_id' => $this->settlement->id
                ]
            ]
        ];
    }
}

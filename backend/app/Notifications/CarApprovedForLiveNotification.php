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
                'car_id'     => (string) ($car?->id ?? ''),
            ]);
    }

    public function toArray($notifiable): array
    {
        $car = $this->auction->car;

        return [
            'type'          => 'car_approved_for_live',
            'auction_id'    => $this->auction->id,
            'car_id'        => $car?->id,
            'car_name'      => $car ? "{$car->make} {$car->model} {$car->year}" : null,
            'opening_price' => $this->auction->opening_price,
            'message'       => 'تمت الموافقة على سيارتك للمشاركة في المزاد المباشر',
        ];
    }
}

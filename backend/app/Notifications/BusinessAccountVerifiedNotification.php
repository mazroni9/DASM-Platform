<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;

class BusinessAccountVerifiedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public User $businessUser)
    {
        $this->afterCommit = true;
    }

    public function via(object $notifiable): array
    {
        return [FcmChannel::class, 'database'];
    }

    public function toFcm($notifiable): FcmMessage
    {
        $userName = $this->businessUser->first_name . ' ' . $this->businessUser->last_name;
        $accountType = $this->businessUser->type->value ?? $this->businessUser->type;
        $accountTypeLabel = match ($accountType) {
            'dealer' => 'تاجر سيارات',
            'venue_owner' => 'مالك معرض',
            default => 'حساب تجاري',
        };

        return (new FcmMessage(notification: new FcmNotification(
            title: 'طلب تفعيل حساب تجاري جديد',
            body: "قام {$userName} بتأكيد بريده الإلكتروني كـ {$accountTypeLabel}. يرجى مراجعة طلب التفعيل.",
            image: asset('assets/images/logo.jpg')
        )))
            ->data([
                'user_id' => (string)$this->businessUser->id,
                'account_type' => $accountType,
                'icon' => 'user-check',
                'color' => 'amber'
            ])
            ->custom([
                "webpush" => [
                    "headers" => ["Urgency" => "high"],
                    'fcm_options' => [
                        "link" => "/admin/users/{$this->businessUser->id}",
                    ]
                ],
                'android' => [
                    'notification' => [
                        'color' => '#F59E0B',
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

    public function toArray(object $notifiable): array
    {
        $userName = $this->businessUser->first_name . ' ' . $this->businessUser->last_name;
        $accountType = $this->businessUser->type->value ?? $this->businessUser->type;
        $accountTypeLabel = match ($accountType) {
            'dealer' => 'تاجر سيارات',
            'venue_owner' => 'مالك معرض',
            default => 'حساب تجاري',
        };

        return [
            'title' => 'طلب تفعيل حساب تجاري جديد',
            'body' => "قام {$userName} بتأكيد بريده الإلكتروني كـ {$accountTypeLabel}. يرجى مراجعة طلب التفعيل.",
            'icon' => 'user-check',
            'color' => 'amber',
            'data' => [
                'user_id' => $this->businessUser->id,
                'account_type' => $accountType,
                'type' => 'business_account_verified',
            ],
            'action' => [
                'type' => 'VIEW_USER_DETAILS',
                'route_name' => '/admin/users/[user_id]',
                'route_params' => [
                    'user_id' => $this->businessUser->id
                ]
            ]
        ];
    }
}

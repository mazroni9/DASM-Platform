<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class VerifyEmailNotification extends Notification
{
    use Queueable;

    protected string $verificationUrl;

    public function __construct(string $verificationUrl)
    {
        $this->verificationUrl = $verificationUrl;
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('تفعيل حسابك - مزاد السيارات')
            ->greeting('مرحباً ' . ($notifiable->first_name ?? '') . '!')
            ->line('شكراً لتسجيلك في منصتنا. يرجى النقر على الزر أدناه لتفعيل حسابك.')
            ->action('تفعيل الحساب', $this->verificationUrl)
            ->line('إذا لم تقم بإنشاء حساب، يرجى تجاهل هذا البريد الإلكتروني.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'verification_url' => $this->verificationUrl
        ];
    }
}

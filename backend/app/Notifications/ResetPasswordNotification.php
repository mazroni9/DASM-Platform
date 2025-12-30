<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResetPasswordNotification extends Notification
{
    use Queueable;

    protected string $resetUrl;

    public function __construct(string $resetUrl)
    {
        $this->resetUrl = $resetUrl;
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('إعادة تعيين كلمة المرور - منصة DASM')
            ->greeting('مرحباً ' . ($notifiable->first_name ?? '') . '!')
            ->line('لقد تلقينا طلبًا لإعادة تعيين كلمة المرور الخاصة بحسابك. يرجى النقر على الزر أدناه لإعادة تعيين كلمة المرور.')
            ->action('إعادة تعيين كلمة المرور', $this->resetUrl)
            ->line('إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد الإلكتروني.')
            ->line('سينتهي رابط إعادة تعيين كلمة المرور خلال 60 دقيقة.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'reset_url' => $this->resetUrl
        ];
    }
}

<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;

class ResetPasswordNotification extends Notification
{
    use Queueable;

    /**
     * The reset password URL.
     */
    protected $resetUrl;

    /**
     * Create a new notification instance.
     */
    public function __construct(string $resetUrl)
    {
        $this->resetUrl = $resetUrl;
        Log::info('ResetPasswordNotification constructed', ['reset_url' => $resetUrl]);
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        Log::info('Setting up notification channels for password reset', [
            'user_email' => $notifiable->email,
            'channels' => ['mail']
        ]);
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        Log::info('Creating mail message for password reset', [
            'user_email' => $notifiable->email,
            'user_name' => $notifiable->first_name
        ]);
        
        try {
            $mailMessage = (new MailMessage)
                ->subject('إعادة تعيين كلمة المرور - منصة DASM')
                ->greeting('مرحباً ' . $notifiable->first_name . '!')
                ->line('لقد تلقينا طلبًا لإعادة تعيين كلمة المرور الخاصة بحسابك. يرجى النقر على الزر أدناه لإعادة تعيين كلمة المرور.')
                ->action('إعادة تعيين كلمة المرور', $this->resetUrl)
                ->line('إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد الإلكتروني.')
                ->line('سينتهي رابط إعادة تعيين كلمة المرور خلال 60 دقيقة.');
                
            Log::info('Mail message created successfully', [
                'user_email' => $notifiable->email,
                'subject' => 'إعادة تعيين كلمة المرور - منصة DASM'
            ]);
            
            return $mailMessage;
        } catch (\Exception $e) {
            Log::error('Error creating mail message', [
                'error' => $e->getMessage(),
                'user_email' => $notifiable->email
            ]);
            throw $e;
        }
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'reset_url' => $this->resetUrl
        ];
    }
}
<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;

class VerifyEmailNotification extends Notification
{
    use Queueable;

    /**
     * The verification URL.
     */
    protected $verificationUrl;

    /**
     * Create a new notification instance.
     */
    public function __construct(string $verificationUrl)
    {
        $this->verificationUrl = $verificationUrl;
        Log::info('VerifyEmailNotification constructed', ['verification_url' => $verificationUrl]);
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        Log::info('Setting up notification channels for email verification', [
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
        Log::info('Creating mail message for email verification', [
            'user_email' => $notifiable->email,
            'user_name' => $notifiable->first_name
        ]);
        
        try {
            $mailMessage = (new MailMessage)
                ->subject('تفعيل حسابك - مزاد السيارات')
                ->greeting('مرحباً ' . $notifiable->first_name . '!')
                ->line('شكراً لتسجيلك في منصتنا. يرجى النقر على الزر أدناه لتفعيل حسابك.')
                ->action('تفعيل الحساب', $this->verificationUrl)
                ->line('إذا لم تقم بإنشاء حساب، يرجى تجاهل هذا البريد الإلكتروني.');
                
            Log::info('Mail message created successfully', [
                'user_email' => $notifiable->email,
                'subject' => 'تفعيل حسابك - مزاد السيارات'
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
            'verification_url' => $this->verificationUrl
        ];
    }
}

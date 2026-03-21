<?php

namespace App\Notifications;

use App\Models\ApprovalRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ApprovalRequestResolvedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public ApprovalRequest $approvalRequest,
        public bool $approved
    ) {
        $this->afterCommit = true;
    }

    public function via(object $notifiable): array
    {
        $channels = ['database'];
        if ($notifiable->email) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        $verb = $this->approved ? 'تمت الموافقة' : 'تم الرفض';

        return (new MailMessage)
            ->subject('تحديث طلبك — ' . $verb)
            ->greeting('مرحباً ' . ($notifiable->first_name ?? ''))
            ->line("{$verb} على طلبك في النظام.")
            ->line('يمكنك متابعة حسابك من لوحة التحكم.');
    }

    public function toArray(object $notifiable): array
    {
        $verb = $this->approved ? 'موافقة' : 'رفض';

        return [
            'title' => 'تحديث الطلب',
            'body' => "تم تسجيل {$verb} على طلبك.",
            'icon' => $this->approved ? 'check-circle' : 'x-circle',
            'color' => $this->approved ? 'green' : 'red',
            'data' => [
                'type' => 'approval_request_resolved',
                'approval_request_id' => $this->approvalRequest->id,
                'approved' => $this->approved,
            ],
        ];
    }
}

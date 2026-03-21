<?php

namespace App\Notifications;

use App\Models\ApprovalRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;

class ApprovalRequestCreatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public ApprovalRequest $approvalRequest)
    {
        $this->afterCommit = true;
    }

    public function via(object $notifiable): array
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

    public function toMail(object $notifiable): MailMessage
    {
        [$title, $body] = $this->summaryLines();

        return (new MailMessage)
            ->subject($title)
            ->greeting('مرحباً ' . ($notifiable->first_name ?? ''))
            ->line($body)
            ->action('مراجعة الطلبات', url('/admin/control-room/approval-requests'))
            ->line('تم إنشاء طلب موافقة جديد في النظام.');
    }

    public function toFcm($notifiable): FcmMessage
    {
        [$title, $body] = $this->summaryLines();

        return (new FcmMessage(notification: new FcmNotification(
            title: $title,
            body: $body,
            image: asset('assets/images/logo.jpg')
        )))
            ->data([
                'type' => 'approval_request_created',
                'approval_request_id' => (string) $this->approvalRequest->id,
                'request_type' => $this->approvalRequest->request_type,
                'icon' => 'clipboard-list',
                'color' => 'amber',
            ])
            ->custom([
                'webpush' => [
                    'headers' => ['Urgency' => 'high'],
                    'fcm_options' => [
                        'link' => '/admin/control-room/approval-requests',
                    ],
                ],
            ]);
    }

    public function toArray(object $notifiable): array
    {
        [$title, $body] = $this->summaryLines();

        return [
            'title' => $title,
            'body' => $body,
            'icon' => 'clipboard-list',
            'color' => 'amber',
            'data' => [
                'type' => 'approval_request_created',
                'approval_request_id' => $this->approvalRequest->id,
                'request_type' => $this->approvalRequest->request_type,
            ],
        ];
    }

    /** @return array{0:string,1:string} */
    private function summaryLines(): array
    {
        $this->approvalRequest->loadMissing('targetUser');
        $target = $this->approvalRequest->targetUser;
        $name = $target ? trim($target->first_name . ' ' . $target->last_name) : 'مستخدم';

        if ($this->approvalRequest->request_type === ApprovalRequest::TYPE_BUSINESS_ACCOUNT) {
            $type = $this->approvalRequest->payload['account_type'] ?? 'تجاري';

            return [
                'طلب موافقة حساب تجاري',
                "طلب جديد متعلق بالمستخدم {$name} ({$type}).",
            ];
        }

        if ($this->approvalRequest->request_type === ApprovalRequest::TYPE_COUNCIL_PERMISSION) {
            $bundle = $this->approvalRequest->payload['bundle'] ?? '';

            return [
                'طلب صلاحيات استوديو مجلس السوق',
                "المستخدم {$name} يطلب حزمة: {$bundle}.",
            ];
        }

        return [
            'طلب موافقة جديد',
            "طلب رقم {$this->approvalRequest->id}.",
        ];
    }
}

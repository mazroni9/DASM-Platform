<?php

namespace App\Enums;

enum AuctionStatus: string
{
    case SCHEDULED = 'scheduled';
    case ACTIVE = 'live';
    case ENDED = 'ended';
    case CANCELED = 'canceled';
    case FAILED = 'failed';
    case COMPLETED = 'completed';
    /**
     * Get Arabic label (default)
     */
    public function label(): string
    {
        return match($this) {
            self::SCHEDULED => 'مجدول',
            self::ACTIVE => 'نشط',
            self::ENDED => 'منتهي',
            self::CANCELED => 'ملغي',
            self::FAILED => 'فاشل',
            self::COMPLETED => 'مكتمل',
        };
    }

    /**
     * Get English label
     */
    public function englishLabel(): string
    {
        return match($this) {
            self::SCHEDULED => 'Scheduled',
            self::ACTIVE => 'Live',
            self::ENDED => 'Ended',
            self::CANCELED => 'Canceled',
            self::FAILED => 'Failed',
            self::COMPLETED => 'Completed',
        };
    }

    /**
     * Get UI color for status
     */
    public function color(): string
    {
        return match($this) {
            self::SCHEDULED => 'blue',
            self::ACTIVE => 'green',
            self::ENDED => 'gray',
            self::CANCELED => 'red',
            self::FAILED => 'orange',
            self::COMPLETED => 'green',
        };
    }

    /**
     * Get all available status values as array
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Get all statuses with their translations
     */
    public static function getTranslations(): array
    {
        $translations = [];
        foreach (self::cases() as $status) {
            $translations[$status->value] = [
                'ar' => $status->label(),
                'en' => $status->englishLabel(),
                'color' => $status->color()
            ];
        }
        return $translations;
    }
}
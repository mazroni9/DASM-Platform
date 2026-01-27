<?php

namespace Modules\Test\Entities\Enums;

enum TestCategory: string
{
    case LOGIC = 'logic';
    case TRANSITIONS = 'transitions';
    case PRICE_UPDATES = 'price_updates';
    case STATE_CONSISTENCY = 'state_consistency';

    public function label(): string
    {
        return match($this) {
            self::LOGIC => 'منطق المزادات',
            self::TRANSITIONS => 'الانتقال بين الأنواع',
            self::PRICE_UPDATES => 'تحديثات الأسعار',
            self::STATE_CONSISTENCY => 'استقرار الحالات',
        };
    }

    public function englishLabel(): string
    {
        return match($this) {
            self::LOGIC => 'Auction Logic',
            self::TRANSITIONS => 'Type Transitions',
            self::PRICE_UPDATES => 'Price Updates',
            self::STATE_CONSISTENCY => 'State Consistency',
        };
    }

    public function description(): string
    {
        return match($this) {
            self::LOGIC => 'اختبارات منطق المزادات الأساسي (الحالات، الأسعار، القواعد)',
            self::TRANSITIONS => 'اختبارات الانتقال التلقائي بين أنواع المزاد حسب الوقت',
            self::PRICE_UPDATES => 'اختبارات تحديث السعر والمزايدات اللحظية',
            self::STATE_CONSISTENCY => 'اختبارات استقرار الحالات وعدم التضارب',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public static function getServiceClass(string $category): string
    {
        return match($category) {
            self::LOGIC->value => \Modules\Test\Services\Tests\LogicTestService::class,
            self::TRANSITIONS->value => \Modules\Test\Services\Tests\TransitionsTestService::class,
            self::PRICE_UPDATES->value => \Modules\Test\Services\Tests\PriceUpdatesTestService::class,
            self::STATE_CONSISTENCY->value => \Modules\Test\Services\Tests\StateConsistencyTestService::class,
            default => throw new \InvalidArgumentException("Unknown test category: {$category}"),
        };
    }
}

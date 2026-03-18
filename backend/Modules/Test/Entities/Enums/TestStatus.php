<?php

namespace Modules\Test\Entities\Enums;

enum TestStatus: string
{
    case PENDING = 'pending';
    case RUNNING = 'running';
    case PASSED = 'passed';
    case FAILED = 'failed';

    public function label(): string
    {
        return match($this) {
            self::PENDING => 'في الانتظار',
            self::RUNNING => 'قيد التشغيل',
            self::PASSED => 'نجح',
            self::FAILED => 'فشل',
        };
    }

    public function englishLabel(): string
    {
        return match($this) {
            self::PENDING => 'Pending',
            self::RUNNING => 'Running',
            self::PASSED => 'Passed',
            self::FAILED => 'Failed',
        };
    }

    public function color(): string
    {
        return match($this) {
            self::PENDING => 'gray',
            self::RUNNING => 'blue',
            self::PASSED => 'green',
            self::FAILED => 'red',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}

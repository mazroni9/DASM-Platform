<?php

namespace Bl\FatooraZatca\Classes;

class ReportMethod
{
    const AUTO = 'auto';
    const MANUAL = 'manual';

    /**
     * check the report method if auto.
     *
     * @param  string $method
     * @return bool
     */
    public static function isAuto($method): bool
    {
        return $method === self::AUTO;
    }

    /**
     * check the report method if manual.
     *
     * @param  string $method
     * @return bool
     */
    public static function isManual($method): bool
    {
        return $method === self::MANUAL;
    }
}

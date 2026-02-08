<?php 

namespace Bl\FatooraZatca\Traits;

use Exception;

trait Exemption
{
    public static function getOptions($locale = 'ar')
    {
        $className = class_basename(self::class);
        $fileName = __DIR__ . "/../ExemptionReasons/{$locale}/{$className}.php";

        if(! file_exists($fileName)) {
            throw new Exception("file reason not exists for class [{$className}] and locale [{$locale}] ");
        }

        return include $fileName;
    }
}
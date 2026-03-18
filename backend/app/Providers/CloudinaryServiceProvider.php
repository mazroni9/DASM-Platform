<?php

namespace App\Providers;

use Cloudinary\Cloudinary;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Log;

class CloudinaryServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton(Cloudinary::class, function () {

            $cloudName = (string) config('cloudinary.cloud_name', '');
            $apiKey    = (string) config('cloudinary.api_key', '');
            $apiSecret = (string) config('cloudinary.api_secret', '');

            if ($cloudName === '' || $apiKey === '' || $apiSecret === '') {
                throw new \RuntimeException(
                    'Cloudinary configuration missing. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in your .env file.'
                );
            }

            // ✅ لوج آمن جدًا (بدون أسرار) + فقط في local/debug
            if (config('app.debug') === true && app()->environment('local')) {
                Log::debug('Cloudinary configuration loaded (safe)', [
                    'cloud_name' => 'set',
                    'api_key' => 'set',
                    'api_secret' => 'set',
                    'secure' => (bool) config('cloudinary.secure', true),
                    'http_verify' => (bool) config('cloudinary.http.verify', true),
                ]);
            }

            return new Cloudinary([
                'cloud' => [
                    'cloud_name' => $cloudName,
                    'api_key' => $apiKey,
                    'api_secret' => $apiSecret,
                ],
                'url' => [
                    'secure' => (bool) config('cloudinary.secure', true),
                ],
                'http' => [
                    // ✅ مهم: ما نخليش verify=false افتراضيًا (دي مخاطرة أمنية)
                    // لو عايز تقفله محليًا: CLOUDINARY_HTTP_VERIFY=false
                    'verify' => (bool) config('cloudinary.http.verify', true),
                    'timeout' => (int) config('cloudinary.http.timeout', 30),
                    'connect_timeout' => (int) config('cloudinary.http.connect_timeout', 10),
                ],
            ]);
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}

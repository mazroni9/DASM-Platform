<?php

namespace App\Providers;

use Cloudinary\Cloudinary;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Log;

class CloudinaryServiceProvider extends ServiceProvider
{    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton(Cloudinary::class, function ($app) {
            try {
                // Get configuration from environment variables only
                $cloudName = config('cloudinary.cloud_name');
                $apiKey = config('cloudinary.api_key');
                $apiSecret = config('cloudinary.api_secret');

                // Ensure all required config is available
                if (empty($cloudName) || empty($apiKey) || empty($apiSecret)) {
                    throw new \Exception('Cloudinary configuration missing. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.');
                }

                // Log config status (without revealing secrets)
                Log::debug('Cloudinary configuration loaded', [
                    'cloud_name' => !empty($cloudName) ? 'set' : 'not set',
                    'api_key' => !empty($apiKey) ? 'set' : 'not set',
                    'api_secret' => !empty($apiSecret) ? 'set' : 'not set',
                ]);

                // Return the configured Cloudinary instance
                return new Cloudinary([
                    'cloud' => [
                        'cloud_name' => $cloudName,
                        'api_key' => $apiKey,
                        'api_secret' => $apiSecret,
                    ],
                    'url' => [
                        'secure' => true,
                    ],
                    'http' => [
                        'verify' => false, // Disable SSL verification for development
                        'timeout' => 30,
                        'connect_timeout' => 10
                    ]
                ]);
            } catch (\Exception $e) {
                Log::error('Error initializing Cloudinary: ' . $e->getMessage(), [
                    'exception' => get_class($e),
                    'message' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine()
                ]);

                // Don't return a fallback with hardcoded credentials
                throw $e;
            }
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

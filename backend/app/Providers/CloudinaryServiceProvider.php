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
        $this->app->singleton(Cloudinary::class, function ($app) {
            try {
                // Get configuration from multiple sources with fallbacks
                $cloudName = config('cloudinary.cloud_name') 
                    ?? config('filesystems.disks.cloudinary.cloud') 
                    ?? env('CLOUDINARY_CLOUD_NAME') 
                    ?? 'djwcvewmf';
                    
                $apiKey = config('cloudinary.api_key') 
                    ?? config('filesystems.disks.cloudinary.key') 
                    ?? env('CLOUDINARY_API_KEY') 
                    ?? '238883787975283';
                    
                $apiSecret = config('cloudinary.api_secret') 
                    ?? config('filesystems.disks.cloudinary.secret') 
                    ?? env('CLOUDINARY_API_SECRET') 
                    ?? '_5B112A1vNqzO8TOfU1z1Y_djGU';
                
                // Log config values (without revealing secrets)
                Log::debug('Cloudinary configuration loaded', [
                    'cloud_name' => $cloudName,
                    'api_key' => !empty($apiKey) ? 'set' : 'not set',
                    'api_secret' => !empty($apiSecret) ? 'set' : 'not set',
                ]);
                
                // Return the configured Cloudinary instance with SSL handling
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
                
                // Return a default instance as fallback
                return new Cloudinary([
                    'cloud' => [
                        'cloud_name' => 'djwcvewmf',
                        'api_key' => '238883787975283',
                        'api_secret' => '_5B112A1vNqzO8TOfU1z1Y_djGU',
                    ],
                    'url' => [
                        'secure' => true,
                    ],
                    'http' => [
                        'verify' => false,
                        'timeout' => 30,
                        'connect_timeout' => 10
                    ]
                ]);
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

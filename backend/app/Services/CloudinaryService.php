<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Http\UploadedFile;

class CloudinaryService
{
    /**
     * Fake upload image and return placeholder URL (for testing only)
     *
     * @param UploadedFile $file
     * @param string $folder
     * @param string|null $publicId
     * @return string
     */
    public function uploadImage(UploadedFile $file, string $folder = 'general', string $publicId = null)
    {
        // Generate fake public ID if not provided
        if (!$publicId) {
            $publicId = 'car_' . time() . '_' . rand(1000, 9999);
        }

        // Log fake upload
        Log::info('⚠️ Skipping Cloudinary upload - using fake image URL', [
            'filename' => $file->getClientOriginalName(),
            'folder' => $folder,
            'public_id' => $publicId
        ]);

        // Return fake image URL
        return '/fake-storage/' . $folder . '/' . $publicId . '.jpg';
    }
}

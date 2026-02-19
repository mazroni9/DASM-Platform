<?php

namespace App\Services;

use Cloudinary\Cloudinary;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class CloudinaryService
{
    /**
     * The Cloudinary instance
     *
     * @var Cloudinary
     */
    protected $cloudinary;

    /**
     * Create a new CloudinaryService instance.
     *
     * @param Cloudinary $cloudinary
     */
    public function __construct(Cloudinary $cloudinary)
    {
        $this->cloudinary = $cloudinary;
    }

    /**
     * Upload an image to Cloudinary
     *
     * @param UploadedFile $file
     * @param string $folder
     * @param string $publicId
     * @return string
     */
    public function uploadImage(UploadedFile $file, string $folder = 'general', string $publicId = null)
    {
        try {
            // Log what we're attempting to upload
            Log::info('Attempting Cloudinary upload', [
                'file_name' => $file->getClientOriginalName(),
                'file_size' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
                'folder' => $folder,
                'public_id' => $publicId
            ]);

            // Check if file is a document or PDF
            $mimeType = $file->getMimeType();
            $isDocument = in_array($mimeType, [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation'
            ]);

            // Build upload options with strict TLS verification.
            $uploadOptions = [
                'folder' => $folder,
                'resource_type' => $isDocument ? 'raw' : 'image',
            ];


            if ($publicId) {
                // إذا كان مستند ولا يحتوي على امتداد، أضف الامتداد
                if ($isDocument && !pathinfo($publicId, PATHINFO_EXTENSION)) {
                    $extension = $file->getClientOriginalExtension();
                    $publicId = $publicId . '.' . $extension;
                }
                $uploadOptions['public_id'] = $publicId;
            }

            // Add document-specific or image-specific options
            // if ($isDocument) {
            //     $uploadOptions['raw_convert'] = 'aspose';
            // } else {
            //     $uploadOptions['format'] = 'jpg';
            //     $uploadOptions['quality'] = 'auto';
            //     $uploadOptions['fetch_format'] = 'auto';
            // }

            // Add public_id if provided
            if ($publicId) {
                $uploadOptions['public_id'] = $publicId;
            }

            // Configure HTTP client with strict TLS verification
            $httpOptions = [
                'verify' => true,
                'timeout' => 30,
                'connect_timeout' => 10
            ];

            // Create a new Cloudinary instance with proper configuration
            $cloudinary = new Cloudinary([
                'cloud' => [
                    'cloud_name' => config('cloudinary.cloud_name', env('CLOUDINARY_CLOUD_NAME')),
                    'api_key' => config('cloudinary.api_key', env('CLOUDINARY_API_KEY')),
                    'api_secret' => config('cloudinary.api_secret', env('CLOUDINARY_API_SECRET')),
                ],
                'url' => [
                    'secure' => true,
                ],
                'http' => $httpOptions
            ]);

            // Upload using the configured instance
            $result = $cloudinary->uploadApi()->upload($file->getRealPath(), $uploadOptions);

            // Log successful upload
            Log::info('Cloudinary upload successful', [
                'secure_url' => $result['secure_url'],
                'public_id' => $result['public_id']
            ]);

            return $result['secure_url'];

        } catch (\Exception $e) {
            // Log the detailed error
            Log::error('Cloudinary upload failed: ' . $e->getMessage(), [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'message' => $e->getMessage()
            ]);

            // Try to save locally as fallback
            try {
                $filename = 'car_' . time() . '_' . rand(1000, 9999) . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs('temp', $filename, 'public');

                Log::info('Image saved locally as fallback', [
                    'path' => $path,
                    'filename' => $filename
                ]);

                return '/storage/' . $path;

            } catch (\Exception $localException) {
                Log::error('Local storage fallback also failed: ' . $localException->getMessage());

                // Return a placeholder URL as last resort
                return '/uploads/failed/placeholder_' . time() . '_' . rand(1000, 9999) . '.jpg';
            }
        }
    }
}

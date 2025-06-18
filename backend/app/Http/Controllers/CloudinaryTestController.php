<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\CloudinaryService;
use Illuminate\Support\Facades\Log;
use Cloudinary\Cloudinary;

class CloudinaryTestController extends Controller
{
    /**
     * Test the Cloudinary configuration
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function testConfig()
    {
        try {
            // Get the configuration settings
            $cloudName = config('filesystems.disks.cloudinary.cloud');
            $apiKey = config('filesystems.disks.cloudinary.key');
            $apiSecret = config('filesystems.disks.cloudinary.secret');
            
            $configStatus = [
                'cloud_name' => $cloudName ? 'set' : 'not set',
                'api_key' => $apiKey ? 'set' : 'not set',
                'api_secret' => $apiSecret ? 'set' : 'not set',
                'all_set' => ($cloudName && $apiKey && $apiSecret) ? true : false
            ];
            
            // Try to initialize the Cloudinary client
            $cloudinary = app(Cloudinary::class);
            
            // Check if Cloudinary client was successfully created
            $clientStatus = !empty($cloudinary) ? 'success' : 'failed';
            
            return response()->json([
                'status' => 'success',
                'message' => 'Cloudinary configuration test',
                'config' => $configStatus,
                'client' => $clientStatus
            ]);
        } catch (\Exception $e) {
            Log::error('Cloudinary config test error: ' . $e->getMessage(), [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Cloudinary configuration test failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Test uploading a placeholder image to Cloudinary
     * 
     * @param CloudinaryService $cloudinaryService
     * @return \Illuminate\Http\JsonResponse
     */
    public function testUpload(CloudinaryService $cloudinaryService)
    {
        try {
            // Create a test image
            $width = 400;
            $height = 300;
            $image = imagecreatetruecolor($width, $height);
            
            // Create some colors
            $bgColor = imagecolorallocate($image, 230, 230, 230);
            $textColor = imagecolorallocate($image, 0, 0, 0);
            
            // Fill background
            imagefill($image, 0, 0, $bgColor);
            
            // Add text
            $text = 'Cloudinary Test Image';
            $font = 5; // built-in font
            $textWidth = imagefontwidth($font) * strlen($text);
            $textHeight = imagefontheight($font);
            $x = ($width - $textWidth) / 2;
            $y = ($height - $textHeight) / 2;
            imagestring($image, $font, $x, $y, $text, $textColor);
            
            // Save the image to a temporary file
            $tempFile = tempnam(sys_get_temp_dir(), 'cloudinary_test_');
            imagejpeg($image, $tempFile, 90);
            imagedestroy($image);
            
            // Create an UploadedFile instance
            $uploadedFile = new \Illuminate\Http\UploadedFile(
                $tempFile,
                'test_image.jpg',
                'image/jpeg',
                null,
                true
            );
            
            // Try to upload the image
            $uploadedUrl = $cloudinaryService->uploadImage(
                $uploadedFile, 
                'test', 
                'test_image_' . time()
            );
            
            // Return result
            return response()->json([
                'status' => 'success',
                'message' => 'Test image uploaded successfully',
                'url' => $uploadedUrl
            ]);
        } catch (\Exception $e) {
            Log::error('Cloudinary upload test error: ' . $e->getMessage(), [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Cloudinary upload test failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

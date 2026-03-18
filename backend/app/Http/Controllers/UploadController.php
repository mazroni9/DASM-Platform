<?php

namespace App\Http\Controllers;

use App\Http\Requests\UploadImageRequest;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    public function store(UploadImageRequest $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthenticated',
            ], 401);
        }

        // ✅ Rate limit بسيط ضد abuse (مش هيكسر الفرونت)
        $key = 'upload_image:' . sha1($user->id . '|' . (string) $request->ip());
        if (RateLimiter::tooManyAttempts($key, 30)) { // 30 request/min
            return response()->json([
                'status' => 'error',
                'message' => 'Too many requests. Try again later.',
                'retry_after' => RateLimiter::availableIn($key),
            ], 429);
        }
        RateLimiter::hit($key, 60);

        $data = $request->validated();

        $file = $request->file('image');
        if (!$file || !$file->isValid()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid image upload',
            ], 422);
        }

        $folder = $this->sanitizeFolder($data['folder'] ?? null);

        try {
            $uploaded = Cloudinary::upload(
                $file->getRealPath(),
                [
                    'folder' => $folder,
                    'resource_type' => 'image',
                    'unique_filename' => true,
                    'overwrite' => false,

                    // تحسين خفيف للجودة/الحجم بدون ما نغير شكل الرد
                    'transformation' => [
                        'quality' => 'auto',
                        'fetch_format' => 'auto',
                        'flags' => 'strip_profile',
                    ],
                ]
            );

            return response()->json([
                'status'     => 'ok',
                'public_id'  => $uploaded->getPublicId(),
                'secure_url' => $uploaded->getSecurePath(),
                'width'      => $uploaded->getWidth(),
                'height'     => $uploaded->getHeight(),
                'folder'     => $folder,
            ], 200);

        } catch (\Throwable $e) {
            Log::error('Upload image failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Upload failed. Please try again.',
            ], 500);
        }
    }

    private function sanitizeFolder(?string $folder): string
    {
        $default = 'myapp/cars';

        if (!$folder) {
            return $default;
        }

        $folder = trim($folder);

        // منع أي حركات خطرة أو مسارات غريبة
        $folder = str_replace(['..', '\\'], ['', '/'], $folder);

        // يسمح فقط بحروف/أرقام/ / _ -
        $folder = preg_replace('/[^a-zA-Z0-9\/_\-]/', '', $folder) ?: $default;

        // طول منطقي
        if (strlen($folder) < 3 || strlen($folder) > 120) {
            return $default;
        }

        // لو تحب تثبيت prefix (اختياري) عشان التنظيم:
        // لو الفرونت بيبعت folder مختلف، مش هنكسره—هنسمح باللي جاي طالما آمن
        return $folder ?: $default;
    }
}

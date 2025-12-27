<?php

namespace App\Services;

use Cloudinary\Cloudinary;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;

class CloudinaryService
{
    private ?Cloudinary $cloudinary = null;

    /**
     * Lazy init عشان ما يقعش الـ DI لو env ناقص
     */
    private function cld(): ?Cloudinary
    {
        if ($this->cloudinary) {
            return $this->cloudinary;
        }

        // ✅ لو CLOUDINARY_URL موجود خليه يكوّن نفسه تلقائيًا
        // CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
        if (env('CLOUDINARY_URL')) {
            try {
                $this->cloudinary = new Cloudinary();
                return $this->cloudinary;
            } catch (\Throwable $e) {
                Log::error('Cloudinary init from CLOUDINARY_URL failed', ['error' => $e->getMessage()]);
                return null;
            }
        }

        $cloudName = config('services.cloudinary.cloud_name') ?? env('CLOUDINARY_CLOUD_NAME');
        $apiKey    = config('services.cloudinary.api_key') ?? env('CLOUDINARY_API_KEY');
        $apiSecret = config('services.cloudinary.api_secret') ?? env('CLOUDINARY_API_SECRET');

        if (!$cloudName || !$apiKey || !$apiSecret) {
            Log::error('Cloudinary config missing. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET');
            return null;
        }

        try {
            $this->cloudinary = new Cloudinary([
                'cloud' => [
                    'cloud_name' => $cloudName,
                    'api_key'    => $apiKey,
                    'api_secret' => $apiSecret,
                ],
                'url' => [
                    'secure' => true,
                ],
            ]);

            return $this->cloudinary;
        } catch (\Throwable $e) {
            Log::error('Cloudinary init failed', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * ✅ Upload any file and return secure_url
     * - PDF نرفعه كـ image عشان Cloudinary بيعامله كـ image افتراضيًا
     */
    public function uploadFile(UploadedFile $file, string $folder = 'general', ?string $publicId = null): string
    {
        $cld = $this->cld();
        if (!$cld) {
            throw new \RuntimeException('Cloudinary is not configured. Please set CLOUDINARY_URL or keys.');
        }

        try {
            $ext = strtolower($file->getClientOriginalExtension() ?: '');

            $options = [
                'folder'        => $folder,
                'overwrite'     => true,
                'type'          => 'upload', // ✅ مهم: خليه public upload
                // ✅ PDF غالبًا "image asset type" في Cloudinary
                'resource_type' => $ext === 'pdf' ? 'image' : 'auto',
            ];

            if ($publicId) {
                $options['public_id'] = $publicId;
                $options['unique_filename'] = false;
            }

            $res = $cld->uploadApi()->upload($file->getRealPath(), $options);

            // ApiResponse behaves like array-access غالبًا
            $secureUrl = $res['secure_url'] ?? $res['url'] ?? null;
            if (!$secureUrl) {
                throw new \RuntimeException('Cloudinary upload returned no URL');
            }

            return (string) $secureUrl;
        } catch (\Throwable $e) {
            Log::error('Cloudinary upload failed', [
                'error'  => $e->getMessage(),
                'file'   => $file->getClientOriginalName(),
                'folder' => $folder,
            ]);
            throw $e;
        }
    }

    public function uploadImage(UploadedFile $file, string $folder = 'general', ?string $publicId = null): string
    {
        return $this->uploadFile($file, $folder, $publicId);
    }

    public function uploadAuto(UploadedFile $file, string $folder = 'general', ?string $publicId = null): string
    {
        return $this->uploadFile($file, $folder, $publicId);
    }

    /**
     * ✅ أهم دالة: تصلّح أي Cloudinary URL قبل ما يتبعت للـ AI
     * - تشيل transformations/signatures (تجنب strict-transformations / double signing)
     * - لو PDF جايلك raw/upload تحوله image/upload (ده سبب 404 عندك)
     */
    public function makeAccessibleUrl(?string $urlOrPath): ?string
    {
        if (!$urlOrPath) return null;

        // already full URL
        if (!filter_var($urlOrPath, FILTER_VALIDATE_URL)) {
            // local path
            return url($urlOrPath);
        }

        // not cloudinary
        if (!str_contains($urlOrPath, 'res.cloudinary.com')) {
            return $urlOrPath;
        }

        // ✅ لو فيه signature/transformation params سيبه؟ لا: هنرجّع الأصل
        // ✅ لو raw + pdf => نحوله image
        $normalized = $this->normalizeCloudinaryOriginalUrl($urlOrPath);

        return $normalized ?: $urlOrPath;
    }

    /**
     * يبني URL للأصل Original بدون transformations
     * وبيصلّح pdf raw->image
     */
    private function normalizeCloudinaryOriginalUrl(string $url): ?string
    {
        $path = parse_url($url, PHP_URL_PATH) ?: '';
        $path = ltrim($path, '/');

        // expected: {cloud}/{resource_type}/{delivery_type}/...
        $segments = $path === '' ? [] : explode('/', $path);
        if (count($segments) < 3) return null;

        $cloudName    = $segments[0];
        $resourceType = $segments[1]; // image/raw/video
        $deliveryType = $segments[2]; // upload/authenticated/private...

        // find 'upload' segment index (sometimes still at [2], but be safe)
        $uploadIdx = array_search('upload', $segments, true);
        if ($uploadIdx === false) {
            // لو deliveryType مش upload (rare) برضه نحاول
            $uploadIdx = 2;
        }

        $afterUpload = array_slice($segments, $uploadIdx + 1);

        // locate version v123
        $version = null;
        $versionPos = null;
        foreach ($afterUpload as $i => $seg) {
            if (preg_match('/^v\d+$/', $seg)) {
                $version = $seg;
                $versionPos = $i;
                break;
            }
        }

        // public path is after version if found, else last chunks
        if ($versionPos !== null) {
            $publicPathParts = array_slice($afterUpload, $versionPos + 1);
        } else {
            // fallback: assume last 2+ parts are public id; but keep all
            $publicPathParts = $afterUpload;
        }

        if (empty($publicPathParts)) return null;

        $publicPath = implode('/', $publicPathParts);

        // detect extension
        $ext = strtolower(pathinfo($publicPath, PATHINFO_EXTENSION) ?: '');

        // ✅ Fix: PDF غالبًا image asset type → لو الرابط raw/pd fحوّله image
        if ($ext === 'pdf') {
            $resourceType = 'image';
        }

        // ✅ رجّع URL للأصل بدون transformations
        $base = "https://res.cloudinary.com/{$cloudName}/{$resourceType}/upload";
        if ($version) {
            return $base . '/' . $version . '/' . $publicPath;
        }

        return $base . '/' . $publicPath;
    }
}

<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;
use Illuminate\Validation\ValidationException;

class UploadController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'image' => ['required','file','image','max:5120'], // 5MB
            'folder' => ['nullable','string'],
        ]);

        $folder = $data['folder'] ?? 'myapp/cars';

        // ارفع باستخدام Cloudinary SDK
        $uploaded = Cloudinary::upload(
            $request->file('image')->getRealPath(),
            ['folder' => $folder] // تقدر تزود: ['quality'=>'auto','fetch_format'=>'auto']
        );

        return response()->json([
            'status'     => 'ok',
            'public_id'  => $uploaded->getPublicId(),
            'secure_url' => $uploaded->getSecurePath(),
            'width'      => $uploaded->getWidth(),
            'height'     => $uploaded->getHeight(),
            'folder'     => $folder,
        ]);
    }
}

<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        // route already protected by auth:sanctum
        return true;
    }

    public function rules(): array
    {
        return [
            'image'  => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'], // 5MB
            'folder' => ['nullable', 'string', 'max:120'],
        ];
    }

    public function messages(): array
    {
        return [
            'image.required' => 'الصورة مطلوبة',
            'image.image'    => 'الملف لازم يكون صورة',
            'image.mimes'    => 'مسموح فقط: jpg, jpeg, png, webp',
            'image.max'      => 'حجم الصورة لازم يكون أقل من 5MB',
            'folder.string'  => 'folder غير صالح',
            'folder.max'     => 'folder طويل جدًا',
        ];
    }
}

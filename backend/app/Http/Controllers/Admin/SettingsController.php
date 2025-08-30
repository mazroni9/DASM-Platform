<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Setting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Validator;

class SettingsController extends Controller
{
    /**
     * Get all settings
     */
    public function index()
    {
        try {
            $settings = Cache::rememberForever('settings', function () {
                return Setting::all()->pluck('value', 'key');
            });

            // Convert stored settings to the format expected by frontend
            $formattedSettings = [
                'siteName' => $settings['siteName'] ?? 'منصة أسواق المزادات الرقمية السعودية',
                'siteUrl' => $settings['siteUrl'] ?? 'https://mazbrothers.com',
                'adminEmail' => $settings['adminEmail'] ?? 'admin@mazbrothers.com',
                'supportEmail' => $settings['supportEmail'] ?? 'support@mazbrothers.com',
                'platformFee' => (float) ($settings['platformFee'] ?? 5.0),
                'tamFee' => (float) ($settings['tamFee'] ?? 2.5),
                'auctionDuration' => (int) ($settings['auctionDuration'] ?? 24),
                'emailNotifications' => filter_var($settings['emailNotifications'] ?? true, FILTER_VALIDATE_BOOLEAN),
                'smsNotifications' => filter_var($settings['smsNotifications'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'maintenanceMode' => filter_var($settings['maintenanceMode'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'autoApproveAuctions' => filter_var($settings['autoApproveAuctions'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'maxBidAmount' => (int) ($settings['maxBidAmount'] ?? 1000000),
                'minBidIncrement' => (int) ($settings['minBidIncrement'] ?? 100),
            ];

            return response()->json([
                'status' => 'success',
                'data' => $formattedSettings,
                'message' => 'تم تحميل الإعدادات بنجاح'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'حدث خطأ في تحميل الإعدادات',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update settings
     */
    public function update(Request $request)
    {
        try {
            // Validation rules
            $validator = Validator::make($request->all(), [
                'siteName' => 'sometimes|string|max:255',
                'siteUrl' => 'sometimes|url|max:255',
                'adminEmail' => 'sometimes|email|max:255',
                'supportEmail' => 'sometimes|email|max:255',
                'platformFee' => 'sometimes|numeric|min:0|max:100',
                'tamFee' => 'sometimes|numeric|min:0|max:100',
                'auctionDuration' => 'sometimes|integer|min:1|max:168', // max 1 week
                'emailNotifications' => 'sometimes|boolean',
                'smsNotifications' => 'sometimes|boolean',
                'maintenanceMode' => 'sometimes|boolean',
                'autoApproveAuctions' => 'sometimes|boolean',
                'maxBidAmount' => 'sometimes|integer|min:1000',
                'minBidIncrement' => 'sometimes|integer|min:1',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'بيانات غير صحيحة',
                    'errors' => $validator->errors()
                ], 422);
            }

            $settings = $request->except('_token', '_method');

            // Update each setting
            foreach ($settings as $key => $value) {
                // Convert boolean values to string for storage
                if (is_bool($value)) {
                    $value = $value ? '1' : '0';
                }

                Setting::setValue($key, $value);
            }

            // Clear the cache
            Cache::forget('settings');

            return response()->json([
                'status' => 'success',
                'message' => 'تم حفظ الإعدادات بنجاح',
                'data' => $settings
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'حدث خطأ في حفظ الإعدادات',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific setting value
     */
    public function getSetting($key)
    {
        try {
            $value = Setting::getValue($key);

            return response()->json([
                'status' => 'success',
                'data' => [
                    'key' => $key,
                    'value' => $value
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'حدث خطأ في تحميل الإعداد',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

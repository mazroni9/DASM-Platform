<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Setting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class SettingsController extends Controller
{
    /**
     * Cache TTL (1 hour instead of forever)
     */
    private const CACHE_TTL = 3600;

    /**
     * Allowed settings keys (whitelist for security)
     */
    private const ALLOWED_KEYS = [
        'siteName',
        'siteUrl',
        'adminEmail',
        'supportEmail',
        'platformFee',
        'tamFee',
        'muroorFee',
        'CarEntryFees',
        'auctionDuration',
        'emailNotifications',
        'smsNotifications',
        'maintenanceMode',
        'autoApproveAuctions',
        'maxBidAmount',
        'minBidIncrement',
    ];

    /**
     * Get all settings
     */
    public function index()
    {
        try {
            $settings = Cache::remember('settings', self::CACHE_TTL, function () {
                return Setting::all()->pluck('value', 'key');
            });

            $formattedSettings = [
                'siteName'           => $settings['siteName'] ?? 'منصة أسواق المزادات الرقمية السعودية',
                'siteUrl'            => $settings['siteUrl'] ?? 'https://mazbrothers.com',
                'adminEmail'         => $settings['adminEmail'] ?? 'admin@mazbrothers.com',
                'supportEmail'       => $settings['supportEmail'] ?? 'support@mazbrothers.com',
                'platformFee'        => (float) ($settings['platformFee'] ?? 5.0),
                'tamFee'             => (float) ($settings['tamFee'] ?? 0),
                'muroorFee'          => (float) ($settings['muroorFee'] ?? 0),
                'CarEntryFees'       => (float) ($settings['CarEntryFees'] ?? 0),
                'auctionDuration'    => (int) ($settings['auctionDuration'] ?? 24),
                'emailNotifications' => filter_var($settings['emailNotifications'] ?? true, FILTER_VALIDATE_BOOLEAN),
                'smsNotifications'   => filter_var($settings['smsNotifications'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'maintenanceMode'    => filter_var($settings['maintenanceMode'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'autoApproveAuctions'=> filter_var($settings['autoApproveAuctions'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'maxBidAmount'       => (int) ($settings['maxBidAmount'] ?? 1000000),
                'minBidIncrement'    => (int) ($settings['minBidIncrement'] ?? 100),
            ];

            return response()->json([
                'status'  => 'success',
                'data'    => $formattedSettings,
                'message' => 'تم تحميل الإعدادات بنجاح'
            ]);
        } catch (\Exception $e) {
            Log::error('Settings load error', ['error' => $e->getMessage()]);
            
            return response()->json([
                'status'  => 'error',
                'message' => 'حدث خطأ في تحميل الإعدادات',
            ], 500);
        }
    }

    /**
     * Update settings
     */
    public function update(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'siteName'           => 'sometimes|string|max:255',
                'siteUrl'            => 'sometimes|url|max:255',
                'adminEmail'         => 'sometimes|email|max:255',
                'supportEmail'       => 'sometimes|email|max:255',
                'platformFee'        => 'sometimes|numeric|min:0|max:100',
                'tamFee'             => 'sometimes|numeric|min:0',
                'muroorFee'          => 'sometimes|numeric|min:0',
                'CarEntryFees'       => 'sometimes|numeric|min:0',
                'auctionDuration'    => 'sometimes|integer|min:1|max:168',
                'emailNotifications' => 'sometimes|boolean',
                'smsNotifications'   => 'sometimes|boolean',
                'maintenanceMode'    => 'sometimes|boolean',
                'autoApproveAuctions'=> 'sometimes|boolean',
                'maxBidAmount'       => 'sometimes|integer|min:1000',
                'minBidIncrement'    => 'sometimes|integer|min:1',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'بيانات غير صحيحة',
                    'errors'  => $validator->errors()
                ], 422);
            }

            $settings = $request->only(self::ALLOWED_KEYS);
            $updatedKeys = [];

            foreach ($settings as $key => $value) {
                // ✅ Security: Only allow whitelisted keys
                if (!in_array($key, self::ALLOWED_KEYS)) {
                    continue;
                }

                // Convert boolean to string
                if (is_bool($value)) {
                    $value = $value ? '1' : '0';
                }

                Setting::setValue($key, (string) $value);
                $updatedKeys[] = $key;
            }

            // Clear cache
            Cache::forget('settings');

            // ✅ Log the change for audit
            Log::info('Settings updated', [
                'user_id' => auth()->id(),
                'keys'    => $updatedKeys,
            ]);

            return response()->json([
                'status'  => 'success',
                'message' => 'تم حفظ الإعدادات بنجاح',
                'data'    => $settings
            ]);

        } catch (\Exception $e) {
            Log::error('Settings update error', ['error' => $e->getMessage()]);
            
            return response()->json([
                'status'  => 'error',
                'message' => 'حدث خطأ في حفظ الإعدادات',
            ], 500);
        }
    }

    /**
     * Get a specific setting value
     */
    public function getSetting($key)
    {
        try {
            // ✅ Security: Validate key
            if (!in_array($key, self::ALLOWED_KEYS)) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'إعداد غير موجود'
                ], 404);
            }

            $value = Setting::getValue($key);

            return response()->json([
                'status' => 'success',
                'data'   => [
                    'key'   => $key,
                    'value' => $value
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Setting get error', ['key' => $key, 'error' => $e->getMessage()]);
            
            return response()->json([
                'status'  => 'error',
                'message' => 'حدث خطأ في تحميل الإعداد',
            ], 500);
        }
    }
}

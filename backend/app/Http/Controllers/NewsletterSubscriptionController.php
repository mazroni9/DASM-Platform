<?php

namespace App\Http\Controllers;

use App\Models\NewsletterSubscriber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NewsletterSubscriptionController extends Controller
{
    public function subscribe(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email'  => ['required', 'email:rfc,dns', 'max:255'],
            'source' => ['nullable', 'string', 'max:50'], // optional
        ]);

        $email  = strtolower(trim($validated['email']));
        $source = $validated['source'] ?? 'footer';

        // ✅ fast & safe (unique email). avoids race conditions with DB transaction
        $created = false;

        $subscriber = DB::transaction(function () use ($email, $source, $request, &$created) {
            $existing = NewsletterSubscriber::where('email', $email)->lockForUpdate()->first();

            if ($existing) {
                // لو كان unsubscribed ورجع اشترك تاني
                if ($existing->status !== 'subscribed') {
                    $existing->status = 'subscribed';
                }

                $existing->source = $source;
                $existing->ip = $request->ip();
                $existing->user_agent = substr((string) $request->userAgent(), 0, 1000);
                $existing->save();

                return $existing;
            }

            $created = true;

            return NewsletterSubscriber::create([
                'email'      => $email,
                'status'     => 'subscribed',
                'source'     => $source,
                'ip'         => $request->ip(),
                'user_agent' => substr((string) $request->userAgent(), 0, 1000),
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => $created
                ? 'تم تسجيل بريدك بنجاح ✅ شكرًا لاشتراكك! سنرسل لك كل جديد قريبًا.'
                : 'أنت مسجل بالفعل ✅ تم تحديث بيانات الاشتراك بنجاح.',
            'data' => [
                'id'     => $subscriber->id,
                'email'  => $subscriber->email,
                'status' => $subscriber->status,
            ],
        ], 200);
    }
}

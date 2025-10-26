<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;
use App\Models\Broadcast;
use App\Models\Auction;

class BroadcastController extends Controller
{
    /**
     * حذف بث
     */
    public function destroy($id)
    {
        try {
            $broadcast = Broadcast::findOrFail($id);
            $broadcast->delete();

            return response()->json([
                'status'  => 'success',
                'message' => 'تم حذف البث بنجاح'
            ], 200);
        } catch (\Exception $e) {
            Log::error('Broadcast delete failed: '.$e->getMessage());

            return response()->json([
                'status'  => 'error',
                'message' => 'تعذر حذف البث أو غير موجود'
            ], 404);
        }
    }

    /**
     * بث حالي (للعامة)
     */
    public function getCurrentBroadcast()
    {
        try {
            $broadcast = Broadcast::where('is_live', true)
                ->with('auction.car')
                ->first();

            if (!$broadcast) {
                return response()->json([
                    'status'  => 'success',
                    'message' => 'لا يوجد بث مباشر حالياً',
                    'data'    => null
                ]);
            }

            return response()->json([
                'status' => 'success',
                'data'   => [
                    'id'                     => $broadcast->id,
                    'title'                  => $broadcast->title,
                    'description'            => $broadcast->description,
                    'is_live'                => $broadcast->is_live,
                    'youtube_embed_url'      => $broadcast->formatted_embed_url, // accessor في الموديل
                    'youtube_chat_embed_url' => $broadcast->youtube_chat_embed_url,
                    'scheduled_start_time'   => $broadcast->scheduled_start_time,
                    'auction'                => $broadcast->auction, // مفيد للواجهة
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching broadcast: '.$e->getMessage());

            return response()->json([
                'status'  => 'error',
                'message' => 'حدث خطأ أثناء جلب معلومات البث'
            ], 500);
        }
    }

    /**
     * حالة مبسطة (is_live + embed url)
     */
    public function getStatus()
    {
        try {
            $broadcast = Broadcast::where('is_live', true)->first();

            return response()->json([
                'status' => 'success',
                'data'   => [
                    'is_live'           => (bool) $broadcast,
                    'broadcast_id'      => $broadcast?->id,
                    'youtube_embed_url' => $broadcast?->formatted_embed_url,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching broadcast status: '.$e->getMessage());

            return response()->json([
                'status'  => 'error',
                'message' => 'Error fetching broadcast status'
            ], 500);
        }
    }

    /**
     * قائمة البثوث (للوحة الأدمن) مع فلترة/بحث/باجينيشن
     * GET /api/admin/all-broadcasts?status=live|scheduled|completed&q=...&page=1&pageSize=10
     */
    public function getAllBroadcasts(Request $request)
    {
        try {
            $pageSize = (int) ($request->get('pageSize', 10));
            $pageSize = max(1, min($pageSize, 100));

            $q = Broadcast::query()
                ->with(['auction.car'])
                ->orderByDesc('created_at');

            // فلترة بالحالة
            $status = $request->get('status');
            if ($status === 'live') {
                $q->where('is_live', true);
            } elseif ($status === 'scheduled') {
                $q->where('is_live', false)
                  ->whereNull('end_time')
                  ->whereNotNull('scheduled_start_time');
            } elseif ($status === 'completed') {
                $q->whereNotNull('end_time');
            }

            // بحث بالعنوان
            if ($search = $request->get('q')) {
                $q->where('title', 'like', "%{$search}%");
            }

            $broadcasts = $q->paginate($pageSize);

            return response()->json([
                'status' => 'success',
                'data'   => $broadcasts
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching broadcasts: '.$e->getMessage());

            return response()->json([
                'status'  => 'error',
                'message' => 'حدث خطأ أثناء جلب معلومات البث'
            ], 500);
        }
    }

    /**
     * عرض بث واحد للأدمن
     * GET /api/admin/broadcast (أو /api/admin/broadcast?id=123)
     */
    public function show(Request $request)
    {
        try {
            $id = $request->get('id');

            $broadcast = $id
                ? Broadcast::with(['auction.car'])->find($id)
                : Broadcast::with(['auction.car'])->orderByDesc('created_at')->first();

            if (!$broadcast) {
                return response()->json([
                    'status'  => 'success',
                    'message' => 'لم يتم تكوين البث بعد',
                    'data'    => null
                ]);
            }

            return response()->json([
                'status' => 'success',
                'data'   => $broadcast
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching broadcast details: '.$e->getMessage());

            return response()->json([
                'status'  => 'error',
                'message' => 'حدث خطأ أثناء جلب تفاصيل البث'
            ], 500);
        }
    }

    /**
     * إنشاء بث
     * POST /api/admin/broadcast
     */
    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'title'                => 'required|string|max:255',
                'auction_id'           => 'required|integer|exists:auctions,id',
                'description'          => 'nullable|string',
                'stream_url'           => 'nullable|string|max:255',
                'youtube_embed_url'    => 'nullable|string|url',
                'youtube_chat_embed_url' => 'nullable|string|url',
                'scheduled_start_time' => 'nullable|date',
                'is_live'              => 'sometimes|boolean', // افتراضي false
            ]);

            // ممنوع يكون في أكتر من بث لايف في نفس الوقت
            $wantLive = (bool) ($data['is_live'] ?? false);
            if ($wantLive && Broadcast::where('is_live', true)->exists()) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'يوجد بث مباشر حالياً. لا يمكن بدء بث آخر.'
                ], 422);
            }

            // ممنوع تكرار نفس المزاد
            if (Broadcast::where('auction_id', $data['auction_id'])->exists()) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'هذا المزاد لديه بث مسجّل مسبقاً.'
                ], 422);
            }

            $broadcast = new Broadcast();
            $broadcast->title                  = $data['title'];
            $broadcast->auction_id             = $data['auction_id'];
            $broadcast->description            = $data['description'] ?? null;
            $broadcast->stream_url             = $data['stream_url'] ?? null;
            $broadcast->youtube_embed_url      = $data['youtube_embed_url'] ?? null;
            $broadcast->youtube_chat_embed_url = $data['youtube_chat_embed_url'] ?? null;
            $broadcast->scheduled_start_time   = $data['scheduled_start_time'] ?? null;
            $broadcast->is_live                = $wantLive;
            if ($wantLive) {
                $broadcast->actual_start_time = now();
            }
            $broadcast->created_by = Auth::id();
            $broadcast->save();

            return response()->json([
                'status'  => 'success',
                'message' => 'تم إنشاء البث بنجاح',
                'data'    => $broadcast
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'بيانات غير صالحة',
                'errors'  => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error creating broadcast: '.$e->getMessage());

            return response()->json([
                'status'  => 'error',
                'message' => 'حدث خطأ أثناء إنشاء البث'
            ], 500);
        }
    }

    /**
     * تحديث بث
     * PUT /api/admin/broadcast
     */
    public function update(Request $request)
    {
        try {
            $data = $request->validate([
                'id'                     => 'required|integer|exists:broadcasts,id',
                'title'                  => 'sometimes|string|max:255',
                'description'            => 'nullable|string',
                'auction_id'             => 'sometimes|integer|exists:auctions,id',
                'stream_url'             => 'nullable|string|max:255',
                'youtube_embed_url'      => 'nullable|string|url',
                'youtube_chat_embed_url' => 'nullable|string|url',
                'scheduled_start_time'   => 'nullable|date',
                'is_live'                => 'sometimes|boolean',
            ]);

            /** @var Broadcast $broadcast */
            $broadcast = Broadcast::findOrFail($data['id']);

            // لو هيشغل لايف، اتأكد مفيش غيره لايف
            if (array_key_exists('is_live', $data) && $data['is_live'] === true) {
                $exists = Broadcast::where('is_live', true)
                    ->where('id', '!=', $broadcast->id)
                    ->exists();

                if ($exists) {
                    return response()->json([
                        'status'  => 'error',
                        'message' => 'يوجد بث مباشر حالياً. لا يمكن بدء بث آخر.'
                    ], 422);
                }
            }

            // ممنوع تكرار نفس المزاد لبث مختلف
            if (isset($data['auction_id']) && $data['auction_id'] != $broadcast->auction_id) {
                $existsForAuction = Broadcast::where('auction_id', $data['auction_id'])
                    ->where('id', '!=', $broadcast->id)
                    ->exists();

                if ($existsForAuction) {
                    return response()->json([
                        'status'  => 'error',
                        'message' => 'هذا المزاد لديه بث مسجّل مسبقاً.'
                    ], 422);
                }
            }

            // تحديث الحقول
            foreach ([
                'title',
                'description',
                'auction_id',
                'stream_url',
                'youtube_embed_url',
                'youtube_chat_embed_url',
                'scheduled_start_time'
            ] as $field) {
                if (array_key_exists($field, $data)) {
                    $broadcast->{$field} = $data[$field];
                }
            }

            // معالجة تغيّر حالة البث
            if (array_key_exists('is_live', $data)) {
                $nowLive = (bool) $data['is_live'];
                if ($nowLive && !$broadcast->is_live) {
                    $broadcast->is_live = true;
                    if (!$broadcast->actual_start_time) {
                        $broadcast->actual_start_time = now();
                    }
                    $broadcast->end_time = null; // لو كان موقوف قبل كدا
                } elseif (!$nowLive && $broadcast->is_live) {
                    $broadcast->is_live = false;
                    if (!$broadcast->end_time) {
                        $broadcast->end_time = now();
                    }
                }
            }

            $broadcast->updated_by = Auth::id();
            $broadcast->save();

            return response()->json([
                'status'  => 'success',
                'message' => 'تم تحديث البث بنجاح',
                'data'    => $broadcast
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'بيانات غير صالحة',
                'errors'  => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error updating broadcast: '.$e->getMessage());

            return response()->json([
                'status'  => 'error',
                'message' => 'حدث خطأ أثناء تحديث البث'
            ], 500);
        }
    }

    /**
     * تحديث الحالة (قبول is_live أو status موسّعة)
     * PUT /api/admin/broadcast/status
     * Body:
     *   - إما { id, is_live: boolean }
     *   - أو { id, status: "scheduled"|"live"|"stopped"|"completed" }
     */
    public function updateStatus(Request $request)
    {
        try {
            $data = $request->validate([
                'id'     => 'required|integer|exists:broadcasts,id',
                'is_live'=> 'sometimes|boolean',
                'status' => 'sometimes|string|in:scheduled,live,stopped,completed',
            ]);

            /** @var Broadcast $broadcast */
            $broadcast = Broadcast::findOrFail($data['id']);

            // تحويل status النصية لـ is_live + التوقيتات
            if (isset($data['status'])) {
                switch ($data['status']) {
                    case 'live':
                        $data['is_live'] = true;
                        break;
                    case 'scheduled':
                        $data['is_live'] = false;
                        $broadcast->end_time = null;
                        break;
                    case 'stopped':
                        $data['is_live'] = false;
                        if (!$broadcast->end_time) {
                            $broadcast->end_time = now();
                        }
                        break;
                    case 'completed':
                        $data['is_live'] = false;
                        $broadcast->end_time = now();
                        break;
                }
            }

            // منع تشغيل أكتر من بث مباشر
            if (array_key_exists('is_live', $data) && $data['is_live'] === true) {
                $exists = Broadcast::where('is_live', true)
                    ->where('id', '!=', $broadcast->id)
                    ->exists();

                if ($exists) {
                    return response()->json([
                        'status'  => 'error',
                        'message' => 'يوجد بث مباشر حالياً. لا يمكن بدء بث آخر.'
                    ], 422);
                }
            }

            if (array_key_exists('is_live', $data)) {
                if ($data['is_live'] && !$broadcast->is_live) {
                    $broadcast->is_live = true;
                    if (!$broadcast->actual_start_time) {
                        $broadcast->actual_start_time = now();
                    }
                    $broadcast->end_time = null;
                } elseif (!$data['is_live'] && $broadcast->is_live) {
                    $broadcast->is_live = false;
                    if (!$broadcast->end_time) {
                        $broadcast->end_time = now();
                    }
                }
            }

            $broadcast->updated_by = Auth::id();
            $broadcast->save();

            $msg = $broadcast->is_live ? 'تم تفعيل البث المباشر بنجاح' : 'تم إيقاف البث المباشر بنجاح';

            return response()->json([
                'status'  => 'success',
                'message' => $msg,
                'data'    => ['is_live' => $broadcast->is_live]
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'بيانات غير صالحة',
                'errors'  => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error updating broadcast status: '.$e->getMessage());

            return response()->json([
                'status'  => 'error',
                'message' => 'حدث خطأ أثناء تحديث حالة البث'
            ], 500);
        }
    }

    /**
     * إحصائيات للواجهة (/admin/live-stream)
     * GET /api/admin/broadcasts/stats
     */
    public function stats()
    {
        try {
            $total     = Broadcast::count();
            $live      = Broadcast::where('is_live', true)->count();
            $completed = Broadcast::whereNotNull('end_time')->count();
            $scheduled = Broadcast::where('is_live', false)
                                  ->whereNull('end_time')
                                  ->whereNotNull('scheduled_start_time')
                                  ->count();

            // لو عندك عمود viewers/active_viewers في جدول البث، اجمعه
            $viewers = (int) (Broadcast::sum('active_viewers') ?? 0);

            return response()->json([
                'status' => 'success',
                'data'   => [
                    'total'     => $total,
                    'live'      => $live,
                    'scheduled' => $scheduled,
                    'completed' => $completed,
                    'viewers'   => $viewers
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching broadcast stats: '.$e->getMessage());

            return response()->json([
                'status'  => 'error',
                'message' => 'حدث خطأ أثناء جلب الإحصائيات'
            ], 500);
        }
    }
}

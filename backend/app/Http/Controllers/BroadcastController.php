<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Broadcast;
use App\Models\Venue;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class BroadcastController extends Controller
{
    /**
     * Get the current broadcast information for all users
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getCurrentBroadcast()
    {
        try {
            $broadcast = Broadcast::with('venue')->first();
            
            if (!$broadcast) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'لا يوجد بث مباشر حالياً',
                    'data' => null
                ]);
            }
            
            // Return information for public viewing
            return response()->json([
                'status' => 'success',
                'data' => [
                    'id' => $broadcast->id,
                    'title' => $broadcast->title,
                    'description' => $broadcast->description,
                    'is_live' => $broadcast->is_live,
                    'youtube_embed_url' => $broadcast->formatted_embed_url,
                    'youtube_chat_embed_url' => $broadcast->youtube_chat_embed_url,
                    'scheduled_start_time' => $broadcast->scheduled_start_time,
                    'venue' => $broadcast->venue ? [
                        'id' => $broadcast->venue->id,
                        'name' => $broadcast->venue->name,
                        'location' => $broadcast->venue->location
                    ] : null
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching broadcast: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'حدث خطأ أثناء جلب معلومات البث'
            ], 500);
        }
    }

    /**
     * Get the broadcast status (whether it's active)
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getStatus()
    {
        try {
            $broadcast = Broadcast::first();
            
            return response()->json([
                'status' => 'success',
                'is_active' => $broadcast ? $broadcast->is_live : false
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching broadcast status: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'حدث خطأ أثناء التحقق من حالة البث'
            ], 500);
        }
    }

    /**
     * Show the broadcast details for admin
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function show()
    {
        try {
            $broadcast = Broadcast::with('venue')->first();
            
            if (!$broadcast) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'لم يتم تكوين البث بعد',
                    'data' => null
                ]);
            }
            
            return response()->json([
                'status' => 'success',
                'data' => $broadcast
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching broadcast details: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'حدث خطأ أثناء جلب تفاصيل البث'
            ], 500);
        }
    }

    /**
     * Create or update the broadcast configuration
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'venue_id' => 'required|exists:venues,id',
                'youtube_stream_id' => 'nullable|string|max:255',
                'youtube_embed_url' => 'required|string|url',
                'youtube_chat_embed_url' => 'nullable|string|url',
                'is_live' => 'sometimes|boolean',
                'scheduled_start_time' => 'nullable|date',
            ]);
            
            // Check if a broadcast already exists
            $existingBroadcast = Broadcast::first();
            
            if ($existingBroadcast) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'البث موجود بالفعل. استخدم API التحديث بدلاً من ذلك.'
                ], 400);
            }
            
            // Create new broadcast
            $broadcast = new Broadcast();
            $broadcast->title = $data['title'];
            $broadcast->description = $data['description'] ?? null;
            $broadcast->venue_id = $data['venue_id'];
            $broadcast->youtube_stream_id = $data['youtube_stream_id'] ?? null;
            $broadcast->youtube_embed_url = $data['youtube_embed_url'];
            $broadcast->youtube_chat_embed_url = $data['youtube_chat_embed_url'] ?? null;
            $broadcast->is_live = $data['is_live'] ?? false;
            $broadcast->scheduled_start_time = $data['scheduled_start_time'] ?? null;
            $broadcast->created_by = Auth::id();
            $broadcast->save();
            
            // If live, update actual start time
            if ($broadcast->is_live) {
                $broadcast->actual_start_time = now();
                $broadcast->save();
                
                // Update venue status
                $venue = Venue::find($data['venue_id']);
                if ($venue) {
                    $venue->is_live = true;
                    $venue->save();
                }
            }
            
            return response()->json([
                'status' => 'success',
                'message' => 'تم إنشاء البث بنجاح',
                'data' => $broadcast
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'بيانات غير صالحة',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error creating broadcast: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'حدث خطأ أثناء إنشاء البث'
            ], 500);
        }
    }

    /**
     * Update the broadcast configuration
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request)
    {
        try {
            $data = $request->validate([
                'title' => 'sometimes|string|max:255',
                'description' => 'nullable|string',
                'venue_id' => 'sometimes|exists:venues,id',
                'youtube_stream_id' => 'nullable|string|max:255',
                'youtube_embed_url' => 'sometimes|string|url',
                'youtube_chat_embed_url' => 'nullable|string|url',
                'is_live' => 'sometimes|boolean',
                'scheduled_start_time' => 'nullable|date',
            ]);
            
            // Get the broadcast
            $broadcast = Broadcast::first();
            
            if (!$broadcast) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'البث غير موجود. قم بإنشائه أولاً.'
                ], 404);
            }
            
            // Check if venue is being changed and we're live
            $venueChanged = isset($data['venue_id']) && $broadcast->venue_id != $data['venue_id'];
            $wasLive = $broadcast->is_live;
            $willBeLive = $data['is_live'] ?? $broadcast->is_live;
            
            // Update fields
            if (isset($data['title'])) {
                $broadcast->title = $data['title'];
            }
            
            if (isset($data['description'])) {
                $broadcast->description = $data['description'];
            }
            
            if (isset($data['venue_id'])) {
                $broadcast->venue_id = $data['venue_id'];
            }
            
            if (isset($data['youtube_stream_id'])) {
                $broadcast->youtube_stream_id = $data['youtube_stream_id'];
            }
            
            if (isset($data['youtube_embed_url'])) {
                $broadcast->youtube_embed_url = $data['youtube_embed_url'];
            }
            
            if (isset($data['youtube_chat_embed_url'])) {
                $broadcast->youtube_chat_embed_url = $data['youtube_chat_embed_url'];
            }
            
            if (isset($data['scheduled_start_time'])) {
                $broadcast->scheduled_start_time = $data['scheduled_start_time'];
            }
            
            // Handle live status change
            if (isset($data['is_live']) && $data['is_live'] !== $broadcast->is_live) {
                $broadcast->is_live = $data['is_live'];
                
                // If going live, set actual start time
                if ($data['is_live'] && !$broadcast->actual_start_time) {
                    $broadcast->actual_start_time = now();
                }
                
                // If ending stream, set end time
                if (!$data['is_live'] && !$broadcast->end_time) {
                    $broadcast->end_time = now();
                }
            }
            
            $broadcast->updated_by = Auth::id();
            $broadcast->save();
            
            // Handle venue live status updates
            if ($venueChanged || $wasLive != $willBeLive) {
                // If venue changed, update old venue status
                if ($venueChanged && $wasLive) {
                    $oldVenue = Venue::find($broadcast->getOriginal('venue_id'));
                    if ($oldVenue) {
                        $oldVenue->is_live = false;
                        $oldVenue->save();
                    }
                }
                
                // Update new venue status
                $venue = Venue::find($broadcast->venue_id);
                if ($venue) {
                    $venue->is_live = $willBeLive;
                    $venue->save();
                }
            }
            
            return response()->json([
                'status' => 'success',
                'message' => 'تم تحديث البث بنجاح',
                'data' => $broadcast
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'بيانات غير صالحة',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error updating broadcast: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'حدث خطأ أثناء تحديث البث'
            ], 500);
        }
    }

    /**
     * Update broadcast status (live/offline)
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateStatus(Request $request)
    {
        try {
            $data = $request->validate([
                'is_live' => 'required|boolean',
            ]);
            
            $broadcast = Broadcast::first();
            
            if (!$broadcast) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'البث غير موجود. قم بإنشائه أولاً.'
                ], 404);
            }
            
            // Update broadcast status
            $broadcast->is_live = $data['is_live'];
            
            // Update timestamps based on status
            if ($data['is_live'] && !$broadcast->actual_start_time) {
                $broadcast->actual_start_time = now();
            }
            
            if (!$data['is_live'] && !$broadcast->end_time) {
                $broadcast->end_time = now();
            }
            
            $broadcast->updated_by = Auth::id();
            $broadcast->save();
            
            // Update venue status
            $venue = Venue::find($broadcast->venue_id);
            if ($venue) {
                $venue->is_live = $data['is_live'];
                $venue->save();
            }
            
            $action = $data['is_live'] ? 'تفعيل' : 'إيقاف';
            return response()->json([
                'status' => 'success',
                'message' => 'تم ' . $action . ' البث المباشر بنجاح',
                'data' => [
                    'is_live' => $broadcast->is_live
                ]
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'بيانات غير صالحة',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error updating broadcast status: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'حدث خطأ أثناء تحديث حالة البث'
            ], 500);
        }
    }
}
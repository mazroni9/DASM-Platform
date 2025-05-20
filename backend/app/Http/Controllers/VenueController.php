<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Venue;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class VenueController extends Controller
{
    /**
     * Display a listing of venues.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        try {
            $venues = Venue::orderBy('name')->get();
            
            return response()->json([
                'status' => 'success',
                'data' => $venues
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching venues: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'حدث خطأ أثناء جلب المعارض'
            ], 500);
        }
    }

    /**
     * Store a new venue.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'name' => 'required|string|max:255|unique:venues',
                'location' => 'nullable|string|max:255',
                'description' => 'nullable|string',
                'stream_key' => 'nullable|string|max:255',
                'rtmp_url' => 'nullable|string|max:255',
            ]);
            
            $venue = Venue::create($data);
            
            return response()->json([
                'status' => 'success',
                'message' => 'تم إنشاء المعرض بنجاح',
                'data' => $venue
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'بيانات غير صالحة',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error creating venue: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'حدث خطأ أثناء إنشاء المعرض'
            ], 500);
        }
    }

    /**
     * Display the specified venue.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        try {
            $venue = Venue::findOrFail($id);
            
            return response()->json([
                'status' => 'success',
                'data' => $venue
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'المعرض غير موجود'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error fetching venue: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'حدث خطأ أثناء جلب معلومات المعرض'
            ], 500);
        }
    }

    /**
     * Update the specified venue.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        try {
            $venue = Venue::findOrFail($id);
            
            $data = $request->validate([
                'name' => 'sometimes|string|max:255|unique:venues,name,' . $id,
                'location' => 'nullable|string|max:255',
                'description' => 'nullable|string',
                'stream_key' => 'nullable|string|max:255',
                'rtmp_url' => 'nullable|string|max:255',
                'is_live' => 'sometimes|boolean',
            ]);
            
            $venue->update($data);
            
            return response()->json([
                'status' => 'success',
                'message' => 'تم تحديث المعرض بنجاح',
                'data' => $venue
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'المعرض غير موجود'
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'بيانات غير صالحة',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error updating venue: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'حدث خطأ أثناء تحديث المعرض'
            ], 500);
        }
    }

    /**
     * Remove the specified venue.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        try {
            $venue = Venue::findOrFail($id);
            
            // Check if venue has active broadcasts
            if ($venue->broadcasts()->where('is_live', true)->exists()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'لا يمكن حذف المعرض لوجود بث مباشر نشط'
                ], 400);
            }
            
            $venue->delete();
            
            return response()->json([
                'status' => 'success',
                'message' => 'تم حذف المعرض بنجاح'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'المعرض غير موجود'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error deleting venue: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'حدث خطأ أثناء حذف المعرض'
            ], 500);
        }
    }
}
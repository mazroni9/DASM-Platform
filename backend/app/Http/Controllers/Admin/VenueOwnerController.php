<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\VenueOwner;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class VenueOwnerController extends Controller
{
    /**
     * GET /admin/venue-owners
     * Supports: search, status, is_active, sort_by, sort_dir, per_page, page
     */
    public function index(Request $request)
    {
        try {
            $perPage = max(1, min((int)$request->query('per_page', 15), 100));
            $search = trim((string) $request->query('search', ''));
            $status = $request->query('status');
            $isActiveParam = $request->query('is_active');

            $query = VenueOwner::with('user')
            ->select('venue_owners.*')
            ->addSelect(DB::raw('(SELECT COUNT(*) FROM cars WHERE cars.user_id = venue_owners.user_id) as venue_cars_count'));
            // Search functionality
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('venue_name', 'like', "%{$search}%")
                      ->orWhere('commercial_registry', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%")
                      ->orWhereHas('user', function ($userQuery) use ($search) {
                          $userQuery->where('first_name', 'like', "%{$search}%")
                                    ->orWhere('last_name', 'like', "%{$search}%")
                                    ->orWhere('email', 'like', "%{$search}%");
                      });
                });
            }

            // Status filter
            if ($status !== null && $status !== '') {
                $query->where('status', $status);
            }

            // Active filter
            if ($isActiveParam !== null && $isActiveParam !== '') {
                $normalized = strtolower((string) $isActiveParam);
                if (in_array($normalized, ['1','true','yes','y'], true)) {
                    $query->where('is_active', true);
                } elseif (in_array($normalized, ['0','false','no','n'], true)) {
                    $query->where('is_active', false);
                }
            }

            // Sorting
            $allowedSort = ['id', 'venue_name', 'status', 'is_active', 'created_at', 'updated_at'];
            $sortBy = $request->query('sort_by', 'id');
            $sortDir = strtolower($request->query('sort_dir', 'desc'));
            $sortDir = in_array($sortDir, ['asc','desc'], true) ? $sortDir : 'desc';

            // Handle user name sorting with subquery
            if ($sortBy === 'user_name') {
                $query->orderBy(
                    DB::raw("(SELECT CONCAT(first_name, ' ', last_name) FROM users WHERE users.id = venue_owners.user_id)"),
                    $sortDir
                );
            } elseif (in_array($sortBy, $allowedSort, true)) {
                $query->orderBy($sortBy, $sortDir);
            } else {
                $query->orderBy('id', 'desc');
            }

            $paginator = $query->paginate($perPage, ['*'], 'page', $request->query('page', 1));

            // Format response data to include user_name and user_email
            $formattedData = $paginator->getCollection();/*->map(function ($venueOwner) {
                $data = $venueOwner->toArray();
                if ($venueOwner->user) {
                    $data['user_name'] = $venueOwner->user->first_name . ' ' . $venueOwner->user->last_name;
                    $data['user_email'] = $venueOwner->user->email;
                }
                return $data;
            }); */

            return response()->json([
                'ok'      => true,
                'filters' => [
                    'search'    => $search ?: null,
                    'status'    => $status ?? null,
                    'is_active' => $isActiveParam ?? null,
                    'sort_by'   => $sortBy,
                    'sort_dir'  => $request->query('sort_dir', 'desc'),
                    'per_page'  => $perPage,
                ],
                'data' => $formattedData,
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'per_page'     => $paginator->perPage(),
                    'total'        => $paginator->total(),
                    'last_page'    => $paginator->lastPage(),
                ],
            ], 200);

        } catch (\Throwable $e) {
            Log::error('VenueOwnerController@index error: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'ok' => false,
                'message' => 'Unexpected server error.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /admin/venue-owners/{id}
     */
    public function show(int $id)
    {
        try {
            $venueOwner = VenueOwner::with('user')->find($id);

            if (!$venueOwner) {
                return response()->json([
                    'ok' => false,
                    'message' => 'Venue owner not found',
                ], 404);
            }

            // Format response data to include user_name and user_email
            $data = $venueOwner->toArray();
            if ($venueOwner->user) {
                $data['user_name'] = $venueOwner->user->first_name . ' ' . $venueOwner->user->last_name;
                $data['user_email'] = $venueOwner->user->email;
            }

            return response()->json([
                'ok'   => true,
                'data' => $data,
            ], 200);

        } catch (\Throwable $e) {
            Log::error('VenueOwnerController@show error: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'ok' => false,
                'message' => 'Unexpected server error.',
            ], 500);
        }
    }
}

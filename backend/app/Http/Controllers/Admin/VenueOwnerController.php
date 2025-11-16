<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\VenueOwner;
use App\Models\Car;
use App\Models\ExhibitorWallet;
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

            // Status filter (نستخدم القيم الموجودة في الداتابيز كما هي)
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

            // لو حابب تضيف user_name و user_email ممكن تعمل map هنا
            $formattedData = $paginator->getCollection();

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

            // Format response data to include user_name and user_email if needed
            $data = $venueOwner->toArray();
            if ($venueOwner->user) {
                $data['user_name'] = trim($venueOwner->user->first_name . ' ' . $venueOwner->user->last_name);
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

    /**
     * GET /admin/venue-owners/{id}/cars
     * جلب السيارات التابعة لمالك القاعة (حسب user_id)
     */
    public function cars(Request $request, int $id)
    {
        try {
            $venueOwner = VenueOwner::find($id);

            if (!$venueOwner) {
                return response()->json([
                    'ok'      => false,
                    'message' => 'Venue owner not found',
                ], 404);
            }

            $perPage = max(1, min((int)$request->query('per_page', 10), 100));
            $sortBy  = $request->query('sort_by', 'id');
            $sortDir = strtolower($request->query('sort_dir', 'desc'));
            $sortDir = in_array($sortDir, ['asc', 'desc'], true) ? $sortDir : 'desc';

            $allowedSort = ['id', 'created_at', 'updated_at', 'year', 'evaluation_price', 'auction_status'];

            // لو مالك القاعة ما عندوش user_id نرجع ليست فاضية
            if (!$venueOwner->user_id) {
                return response()->json([
                    'ok'      => true,
                    'filters' => [
                        'search'          => $request->query('search'),
                        'market_category' => $request->query('market_category'),
                        'auction_status'  => $request->query('auction_status'),
                        'sort_by'         => $sortBy,
                        'sort_dir'        => $sortDir,
                        'per_page'        => $perPage,
                    ],
                    'data' => [],
                    'meta' => [
                        'current_page' => 1,
                        'per_page'     => $perPage,
                        'total'        => 0,
                        'last_page'    => 1,
                    ],
                ], 200);
            }

            $query = Car::where('user_id', $venueOwner->user_id)
                ->with('activeAuction') // بدون select مخصص
                ->withCount('activeAuctionBids as total_bids');

            // فلاتر اختيارية
            if ($request->filled('market_category')) {
                $query->where('market_category', $request->query('market_category'));
            }

            if ($request->filled('auction_status')) {
                $query->where('auction_status', $request->query('auction_status'));
            }

            if ($request->filled('search')) {
                $search = trim((string) $request->query('search', ''));
                $query->where(function ($q) use ($search) {
                    $q->where('make', 'like', "%{$search}%")
                      ->orWhere('model', 'like', "%{$search}%")
                      ->orWhere('vin', 'like', "%{$search}%");
                });
            }

            // ترتيب
            if (in_array($sortBy, $allowedSort, true)) {
                $query->orderBy($sortBy, $sortDir);
            } else {
                $query->orderBy('id', 'desc');
            }

            $paginator = $query->paginate($perPage, ['*'], 'page', $request->query('page', 1));
            $items     = $paginator->getCollection();

            return response()->json([
                'ok'      => true,
                'filters' => [
                    'search'          => $request->query('search'),
                    'market_category' => $request->query('market_category'),
                    'auction_status'  => $request->query('auction_status'),
                    'sort_by'         => $sortBy,
                    'sort_dir'        => $sortDir,
                    'per_page'        => $perPage,
                ],
                'data' => $items,
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'per_page'     => $paginator->perPage(),
                    'total'        => $paginator->total(),
                    'last_page'    => $paginator->lastPage(),
                ],
            ], 200);
        } catch (\Throwable $e) {
            Log::error('VenueOwnerController@cars error: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);

            return response()->json([
                'ok'      => false,
                'message' => 'Unexpected server error.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * GET /admin/venue-owners/{id}/wallet
     * ملخص محفظة العارض (Exhibitor Wallet) الخاصة بمالك القاعة
     */
    public function wallet(Request $request, int $id)
    {
        try {
            $venueOwner = VenueOwner::find($id);

            if (!$venueOwner) {
                return response()->json([
                    'ok' => false,
                    'message' => 'Venue owner not found',
                ], 404);
            }

            if (!$venueOwner->user_id) {
                return response()->json([
                    'ok'   => true,
                    'data' => null,
                ], 200);
            }

            $wallet = ExhibitorWallet::firstOrCreate(
                ['user_id' => $venueOwner->user_id],
                ['currency' => 'SAR', 'balance' => 0]
            );

            return response()->json([
                'ok'   => true,
                'data' => [
                    'id'          => $wallet->id,
                    'user_id'     => $wallet->user_id,
                    'balance'     => $wallet->balance,
                    'balance_sar' => $wallet->balance / 100, // نفس منطق Exhibitor\WalletController
                    'currency'    => $wallet->currency,
                ],
            ], 200);
        } catch (\Throwable $e) {
            Log::error('VenueOwnerController@wallet error: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);

            return response()->json([
                'ok'      => false,
                'message' => 'Unexpected server error.',
            ], 500);
        }
    }

    /**
     * GET /admin/venue-owners/{id}/wallet/transactions
     * حركات محفظة العارض المرتبطة بمالك القاعة
     */
    public function walletTransactions(Request $request, int $id)
    {
        try {
            $venueOwner = VenueOwner::find($id);

            if (!$venueOwner) {
                return response()->json([
                    'ok' => false,
                    'message' => 'Venue owner not found',
                ], 404);
            }

            if (!$venueOwner->user_id) {
                return response()->json([
                    'ok'   => true,
                    'data' => [
                        'data'         => [],
                        'current_page' => 1,
                        'last_page'    => 1,
                        'per_page'     => (int)$request->query('per_page', 15),
                        'total'        => 0,
                    ],
                ], 200);
            }

            $wallet = ExhibitorWallet::firstOrCreate(
                ['user_id' => $venueOwner->user_id],
                ['currency' => 'SAR', 'balance' => 0]
            );

            $perPage = max(1, min((int)$request->query('per_page', 15), 100));

            $txQuery = $wallet->transactions()
                ->orderByDesc('created_at');

            // ممكن تضيف فلتر type/status لو حبيت مستقبلاً هنا

            $paginator = $txQuery->paginate($perPage, ['*'], 'page', $request->query('page', 1));

            return response()->json([
                'ok'   => true,
                'data' => $paginator,
            ], 200);
        } catch (\Throwable $e) {
            Log::error('VenueOwnerController@walletTransactions error: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);

            return response()->json([
                'ok'      => false,
                'message' => 'Unexpected server error.',
            ], 500);
        }
    }

    /**
     * POST /admin/venue-owners/{id}/approve
     * - يفعّل الحساب فقط عن طريق is_active = true
     * - لا يغيّر status احترامًا للـ CHECK CONSTRAINT في قاعدة البيانات
     */
    public function approve(Request $request, int $id)
    {
        try {
            $venueOwner = VenueOwner::with('user')->find($id);

            if (!$venueOwner) {
                return response()->json([
                    'ok' => false,
                    'message' => 'Venue owner not found',
                ], 404);
            }

            DB::transaction(function () use ($venueOwner) {
                $venueOwner->is_active = true;
                $venueOwner->save();

                // لو حابب تفعل user نفسه كمان (اختياري):
                // if ($venueOwner->user) {
                //     $venueOwner->user->is_active = true;
                //     $venueOwner->user->save();
                // }
            });

            return response()->json([
                'ok' => true,
                'message' => 'Venue owner activated successfully',
                'data' => $venueOwner->fresh('user'),
            ], 200);

        } catch (\Throwable $e) {
            Log::error('VenueOwnerController@approve error: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'ok' => false,
                'message' => 'Unexpected server error.',
            ], 500);
        }
    }

    /**
     * POST /admin/venue-owners/{id}/reject
     * - يعطّل الحساب عن طريق is_active = false
     * - لا يغيّر status (لتجنّب كسر الـ CHECK CONSTRAINT)
     * - يمكن استخدام commission_note كحقل لسبب الرفض لو حابب
     */
    public function reject(Request $request, int $id)
    {
        try {
            $venueOwner = VenueOwner::with('user')->find($id);

            if (!$venueOwner) {
                return response()->json([
                    'ok' => false,
                    'message' => 'Venue owner not found',
                ], 404);
            }

            DB::transaction(function () use ($venueOwner, $request) {
                $venueOwner->is_active = false;

                // سبب الرفض (اختياري) نخزنه في commission_note أو اعمل له عمود مخصص لاحقًا
                if ($request->filled('reject_reason')) {
                    $venueOwner->commission_note = $request->input('reject_reason');
                }

                $venueOwner->save();
            });

            return response()->json([
                'ok' => true,
                'message' => 'Venue owner deactivated (rejected) successfully',
                'data' => $venueOwner->fresh('user'),
            ], 200);

        } catch (\Throwable $e) {
            Log::error('VenueOwnerController@reject error: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'ok' => false,
                'message' => 'Unexpected server error.',
            ], 500);
        }
    }

    /**
     * POST /admin/venue-owners/{id}/toggle-status
     * - يغيّر قيمة is_active (ON/OFF) بدون تغيير status
     */
    public function toggleStatus(int $id)
    {
        try {
            $venueOwner = VenueOwner::with('user')->find($id);

            if (!$venueOwner) {
                return response()->json([
                    'ok' => false,
                    'message' => 'Venue owner not found',
                ], 404);
            }

            $venueOwner->is_active = ! (bool) $venueOwner->is_active;
            $venueOwner->save();

            return response()->json([
                'ok' => true,
                'message' => 'Venue owner active status updated',
                'data' => [
                    'id'        => $venueOwner->id,
                    'is_active' => (bool) $venueOwner->is_active,
                    'status'    => $venueOwner->status,
                ],
            ], 200);

        } catch (\Throwable $e) {
            Log::error('VenueOwnerController@toggleStatus error: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'ok' => false,
                'message' => 'Unexpected server error.',
            ], 500);
        }
    }
}

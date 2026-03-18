<?php

namespace App\Http\Controllers\Dealer;

use App\Http\Controllers\Controller;
use App\Models\WatchlistMenu;
use App\Models\WatchlistItem;
use App\Models\Car;
use App\Models\Auction;
use App\Enums\AuctionStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WatchlistController extends Controller
{
    /**
     * GET /api/dealer/watchlists
     * Fetch all user-created watchlist menus.
     */
    public function index()
    {
        $user = Auth::user();

        $menus = WatchlistMenu::where('user_id', $user->id)
            ->withCount('items')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($menu) {
                return [
                    'id' => $menu->id,
                    'name' => $menu->name,
                    'count' => $menu->items_count,
                    'created_at' => $menu->created_at,
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => $menus,
        ]);
    }

    /**
     * POST /api/dealer/watchlists
     * Create a new custom watchlist menu.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100',
        ]);

        $user = Auth::user();

        // Check for duplicate names
        $exists = WatchlistMenu::where('user_id', $user->id)
            ->where('name', $request->input('name'))
            ->exists();

        if ($exists) {
            return response()->json([
                'status' => 'error',
                'message' => 'قائمة المراقبة بهذا الاسم موجودة بالفعل',
            ], 422);
        }

        $menu = WatchlistMenu::create([
            'user_id' => $user->id,
            'name' => $request->input('name'),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'تم إنشاء قائمة المراقبة بنجاح',
            'data' => [
                'id' => $menu->id,
                'name' => $menu->name,
                'count' => 0,
            ],
        ], 201);
    }

    /**
     * PUT /api/dealer/watchlists/{id}
     * Update a watchlist menu name.
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:100',
        ]);

        $user = Auth::user();

        $menu = WatchlistMenu::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$menu) {
            return response()->json([
                'status' => 'error',
                'message' => 'قائمة المراقبة غير موجودة',
            ], 404);
        }

        $menu->name = $request->input('name');
        $menu->save();

        return response()->json([
            'status' => 'success',
            'message' => 'تم تحديث قائمة المراقبة',
            'data' => [
                'id' => $menu->id,
                'name' => $menu->name,
            ],
        ]);
    }

    /**
     * DELETE /api/dealer/watchlists/{id}
     * Delete a custom watchlist.
     */
    public function destroy($id)
    {
        $user = Auth::user();

        $menu = WatchlistMenu::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$menu) {
            return response()->json([
                'status' => 'error',
                'message' => 'قائمة المراقبة غير موجودة',
            ], 404);
        }

        $menu->delete(); // Cascade deletes items

        return response()->json([
            'status' => 'success',
            'message' => 'تم حذف قائمة المراقبة',
        ]);
    }

    /**
     * GET /api/dealer/watchlists/{id}/items
     * Fetch vehicles in a specific watchlist menu with auction data.
     */
    public function items($id)
    {
        $user = Auth::user();

        $menu = WatchlistMenu::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$menu) {
            return response()->json([
                'status' => 'error',
                'message' => 'قائمة المراقبة غير موجودة',
            ], 404);
        }

        $items = WatchlistItem::where('watchlist_menu_id', $id)
            ->with(['car:id,make,model,year,images,market_category', 'car.activeAuction:id,car_id,current_bid,end_time,status'])
            ->get()
            ->map(function ($item) {
                $car = $item->car;
                $auction = $car?->activeAuction;
                $images = is_array($car?->images) ? $car->images : [];

                return [
                    'id' => $item->id,
                    'vehicle_id' => $car->id ?? null,
                    'name' => $car ? "{$car->make} {$car->model} {$car->year}" : 'غير متوفر',
                    'type' => $car->market_category?->value ?? 'N/A',
                    'image' => $images[0] ?? null,
                    'current_price' => $auction?->current_bid ?? 0,
                    'status' => $auction?->status?->value ?? 'N/A',
                    'auction_end' => $auction?->end_time ?? null,
                    'has_active_auction' => $auction && $auction->status === AuctionStatus::ACTIVE,
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => [
                'menu' => [
                    'id' => $menu->id,
                    'name' => $menu->name,
                ],
                'items' => $items,
            ],
        ]);
    }

    /**
     * POST /api/dealer/watchlists/{id}/items
     * Add a vehicle to a specific watchlist menu.
     * SINGLE-LIST CONSTRAINT: Car can only be in ONE watchlist per user.
     */
    public function addItem(Request $request, $id)
    {
        $request->validate([
            'car_id' => 'required|integer|exists:cars,id',
        ]);

        $user = Auth::user();

        $menu = WatchlistMenu::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$menu) {
            return response()->json([
                'status' => 'error',
                'message' => 'قائمة المراقبة غير موجودة',
            ], 404);
        }

        // SINGLE-LIST CONSTRAINT: Check if car exists in ANY of user's watchlists
        $existingItem = WatchlistItem::whereHas('menu', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->where('car_id', $request->input('car_id'))->with('menu')->first();

        if ($existingItem) {
            $currentMenu = $existingItem->menu;
            return response()->json([
                'status' => 'error',
                'message' => 'السيارة موجودة بالفعل في قائمة "' . $currentMenu->name . '"',
                'data' => [
                    'current_menu_id' => $currentMenu->id,
                    'current_menu_name' => $currentMenu->name,
                ],
            ], 422);
        }

        $item = WatchlistItem::create([
            'watchlist_menu_id' => $id,
            'car_id' => $request->input('car_id'),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'تمت إضافة السيارة إلى القائمة',
            'data' => [
                'id' => $item->id,
                'car_id' => $item->car_id,
            ],
        ], 201);
    }

    /**
     * DELETE /api/dealer/watchlists/{menuId}/items/{carId}
     * Remove a vehicle from a specific watchlist menu.
     */
    public function removeItem($menuId, $carId)
    {
        $user = Auth::user();

        $menu = WatchlistMenu::where('id', $menuId)
            ->where('user_id', $user->id)
            ->first();

        if (!$menu) {
            return response()->json([
                'status' => 'error',
                'message' => 'قائمة المراقبة غير موجودة',
            ], 404);
        }

        $deleted = WatchlistItem::where('watchlist_menu_id', $menuId)
            ->where('car_id', $carId)
            ->delete();

        if (!$deleted) {
            return response()->json([
                'status' => 'error',
                'message' => 'السيارة غير موجودة في هذه القائمة',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'تمت إزالة السيارة من القائمة',
        ]);
    }

    /**
     * GET /api/dealer/watchlists/all-items
     * Fetch all watched vehicles across all menus (for unified view).
     */
    public function allItems(Request $request)
    {
        $user = Auth::user();
        $filter = $request->input('filter', 'all'); // all, sedan, suv, etc.

        $query = WatchlistItem::whereHas('menu', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })
            ->with(['car:id,make,model,year,images,market_category', 'car.activeAuction:id,car_id,current_bid,end_time,status', 'menu:id,name']);

        // Apply body type filter
        if ($filter !== 'all') {
            $query->whereHas('car', function ($q) use ($filter) {
                $q->where('market_category', $filter);
            });
        }

        $items = $query->get()->map(function ($item) {
            $car = $item->car;
            $auction = $car?->activeAuction;
            $images = is_array($car?->images) ? $car->images : [];

            return [
                'id' => $item->id,
                'vehicle_id' => $car->id ?? null,
                'name' => $car ? "{$car->make} {$car->model} {$car->year}" : 'غير متوفر',
                'type' => $car->market_category?->value ?? 'N/A',
                'image' => $images[0] ?? null,
                'current_price' => $auction?->current_bid ?? 0,
                'status' => $auction?->status?->value ?? 'N/A',
                'auction_end' => $auction?->end_time ?? null,
                'menu_id' => $item->menu->id,
                'menu_name' => $item->menu->name,
                'has_active_auction' => $auction && $auction->status === AuctionStatus::ACTIVE,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $items,
        ]);
    }

    /**
     * POST /api/dealer/watchlists/quick-add
     * Smart one-click watchlist addition with SINGLE-LIST CONSTRAINT.
     * - Each car can only be in ONE watchlist per user
     * - If car exists in another list and menu_id provided: MOVE the car
     * - If no menus exist: Auto-create "عام" menu and add car
     * - If menus exist but no menu_id: Return list of menus (for popover)
     */
    public function quickAdd(Request $request)
    {
        $request->validate([
            'car_id' => 'required|integer|exists:cars,id',
            'menu_id' => 'nullable|integer',
        ]);

        $user = Auth::user();
        $carId = $request->input('car_id');
        $menuId = $request->input('menu_id');

        // SINGLE-LIST CONSTRAINT: Check if car already exists in ANY of user's watchlists
        $existingItem = WatchlistItem::whereHas('menu', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->where('car_id', $carId)->with('menu')->first();

        // If menu_id is provided
        if ($menuId) {
            $menu = WatchlistMenu::where('id', $menuId)
                ->where('user_id', $user->id)
                ->first();

            if (!$menu) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'قائمة المراقبة غير موجودة',
                ], 404);
            }

            // Car already exists in a watchlist
            if ($existingItem) {
                $currentMenu = $existingItem->menu;

                // If car is already in the same menu
                if ($currentMenu->id == $menuId) {
                    return response()->json([
                        'status' => 'success',
                        'message' => 'السيارة موجودة بالفعل في هذه القائمة',
                        'data' => [
                            'menu_id' => $menu->id,
                            'menu_name' => $menu->name,
                            'already_exists' => true,
                        ],
                    ]);
                }

                // MOVE: Car is in different menu - delete from old, add to new
                $existingItem->delete();
                WatchlistItem::create([
                    'watchlist_menu_id' => $menuId,
                    'car_id' => $carId,
                ]);

                return response()->json([
                    'status' => 'success',
                    'action' => 'moved',
                    'message' => 'تم نقل السيارة إلى "' . $menu->name . '"',
                    'data' => [
                        'from_menu_id' => $currentMenu->id,
                        'from_menu_name' => $currentMenu->name,
                        'menu_id' => $menu->id,
                        'menu_name' => $menu->name,
                    ],
                ]);
            }

            // Car not in any list - add it
            WatchlistItem::create([
                'watchlist_menu_id' => $menuId,
                'car_id' => $carId,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'تمت إضافة السيارة إلى "' . $menu->name . '"',
                'data' => [
                    'menu_id' => $menu->id,
                    'menu_name' => $menu->name,
                ],
            ]);
        }

        // No menu_id provided - check user's menus
        $menus = WatchlistMenu::where('user_id', $user->id)
            ->withCount('items')
            ->get();

        // If user has no menus, create default "عام" menu and add car
        if ($menus->count() === 0) {
            $defaultMenu = WatchlistMenu::create([
                'user_id' => $user->id,
                'name' => 'عام',
            ]);

            WatchlistItem::create([
                'watchlist_menu_id' => $defaultMenu->id,
                'car_id' => $carId,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'تمت إضافة السيارة إلى قائمة "عام"',
                'data' => [
                    'menu_id' => $defaultMenu->id,
                    'menu_name' => $defaultMenu->name,
                    'created_default' => true,
                ],
            ]);
        }

        // Car already exists in a watchlist - return info with menus for moving
        if ($existingItem) {
            $currentMenu = $existingItem->menu;
            $menuList = $menus->map(function ($menu) use ($currentMenu) {
                return [
                    'id' => $menu->id,
                    'name' => $menu->name,
                    'count' => $menu->items_count,
                    'has_car' => $menu->id == $currentMenu->id,
                ];
            });

            return response()->json([
                'status' => 'success',
                'action' => 'already_in_watchlist',
                'message' => 'السيارة موجودة في قائمة "' . $currentMenu->name . '"',
                'data' => [
                    'current_menu_id' => $currentMenu->id,
                    'current_menu_name' => $currentMenu->name,
                    'menus' => $menuList,
                    'car_id' => $carId,
                ],
            ]);
        }

        // User has menus but car not in any - return menus list for popover
        $menuList = $menus->map(function ($menu) {
            return [
                'id' => $menu->id,
                'name' => $menu->name,
                'count' => $menu->items_count,
                'has_car' => false,
            ];
        });

        return response()->json([
            'status' => 'success',
            'action' => 'select_menu',
            'message' => 'اختر قائمة المراقبة',
            'data' => [
                'menus' => $menuList,
                'car_id' => $carId,
            ],
        ]);
    }

    /**
     * POST /api/dealer/watchlists/quick-remove
     * Remove a car from any watchlist it's in.
     */
    public function quickRemove(Request $request)
    {
        $request->validate([
            'car_id' => 'required|integer|exists:cars,id',
        ]);

        $user = Auth::user();
        $carId = $request->input('car_id');

        // Find the item in any of user's watchlists
        $existingItem = WatchlistItem::whereHas('menu', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->where('car_id', $carId)->with('menu')->first();

        if (!$existingItem) {
            return response()->json([
                'status' => 'error',
                'message' => 'السيارة غير موجودة في أي قائمة مراقبة',
            ], 404);
        }

        $menuName = $existingItem->menu->name;
        $existingItem->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'تمت إزالة السيارة من قائمة "' . $menuName . '"',
            'data' => [
                'removed_from_menu' => $menuName,
            ],
        ]);
    }
}

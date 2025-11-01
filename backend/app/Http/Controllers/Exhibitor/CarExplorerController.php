<?php

namespace App\Http\Controllers\Exhibitor;

use App\Http\Controllers\Controller;
use App\Http\Resources\MarketCarResource;
use App\Models\Car;
use Illuminate\Http\Request;

class CarExplorerController extends Controller
{
    /**
     * GET /api/exhibitor/market/cars
     * Query Params:
     *  per_page=12
     *  q (make/model/color/description)
     *  make, model
     *  year_from, year_to
     *  odometer_from, odometer_to
     *  condition, auction_status
     *  price_from, price_to    (evaluation_price)
     *  include_mine=0/1        (افتراضياً 0: استبعاد سياراتي)
     *  sort_by=created_at|year|odometer|evaluation_price
     *  sort_dir=asc|desc
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $perPage = max(1, (int) $request->query('per_page', 12));

        $query = Car::query();

        // افتراضياً: إخفاء سيارات المستخدم نفسه من السوق
        $includeMine = (bool) $request->boolean('include_mine', false);
        if (!$includeMine) {
            $query->where(function ($q) use ($user) {
                $q->where('user_id', '!=', $user->id)
                  ->orWhereNull('user_id');
            });
        }

        // بحث عام
        if ($q = trim((string) $request->query('q', ''))) {
            $like = "%{$q}%";
            $query->where(function ($qq) use ($like) {
                $qq->where('make', 'like', $like)
                   ->orWhere('model', 'like', $like)
                   ->orWhere('color', 'like', $like)
                   ->orWhere('description', 'like', $like);
            });
        }

        // فلترة محددة
        if ($request->filled('make'))   $query->where('make', $request->query('make'));
        if ($request->filled('model'))  $query->where('model', $request->query('model'));

        if ($request->filled('year_from')) $query->where('year', '>=', (int) $request->query('year_from'));
        if ($request->filled('year_to'))   $query->where('year', '<=', (int) $request->query('year_to'));

        if ($request->filled('condition'))      $query->where('condition', $request->query('condition'));
        if ($request->filled('auction_status')) $query->where('auction_status', $request->query('auction_status'));

        if ($request->filled('odometer_from')) $query->where('odometer', '>=', (int) $request->query('odometer_from'));
        if ($request->filled('odometer_to'))   $query->where('odometer', '<=', (int) $request->query('odometer_to'));

        // نطاق السعر المرجعي
        if ($request->filled('price_from')) $query->where('evaluation_price', '>=', (float) $request->query('price_from'));
        if ($request->filled('price_to'))   $query->where('evaluation_price', '<=', (float) $request->query('price_to'));

        // ترتيب
        $allowedSort = ['created_at','year','odometer','evaluation_price'];
        $sortBy  = in_array($request->query('sort_by'), $allowedSort, true) ? $request->query('sort_by') : 'created_at';
        $sortDir = strtolower($request->query('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortBy, $sortDir);

        $paginator = $query->paginate($perPage);

        return MarketCarResource::collection($paginator)->additional(['success' => true]);
    }

    /**
     * GET /api/exhibitor/market/cars/{car}
     */
    public function show(Request $request, Car $car)
    {
        return (new MarketCarResource($car))->additional(['success' => true]);
    }
}

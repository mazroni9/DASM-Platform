<?php

namespace App\Http\Controllers;

use App\Models\Car;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Dealer;
use App\Models\Auction;
use App\Enums\AuctionType;
use App\Enums\CarCondition;
use App\Enums\AuctionStatus;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Http\Resources\CarCollection;
use Illuminate\Support\Facades\Cache;
use App\Http\Resources\CarCardResource;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Schema;
use App\Services\CloudinaryService;
use App\Enums\CarTransmission;
use App\Enums\CarsMarketsCategory;


use App\Notifications\NewCarAddedNotification;

class CarController extends Controller
{
    /**
     * @var CloudinaryService
     */
    protected $cloudinaryService;

    public function __construct(CloudinaryService $cloudinaryService)
    {
        $this->cloudinaryService = $cloudinaryService;
    }

    /**
     * سيارات المستخدم (محمي)
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = Car::where('user_id', $user->id);
        if ($user->role === 'dealer' && $user->dealer) {
            $query->where('dealer_id', $user->dealer->id);
        }

        $query->with('auctions');

        // فلاتر
        if ($request->filled('condition')) {
            $query->where('condition', $request->condition);
        }
        if ($request->filled('auction_status')) {
            $query->where('auction_status', $request->auction_status);
        }
        if ($request->filled('make')) {
            $query->where('make', 'like', '%' . $request->make . '%');
        }
        if ($request->filled('model')) {
            $query->where('model', 'like', '%' . $request->model . '%');
        }
        if ($request->filled('year')) {
            $query->where('year', $request->year);
        }

        // ترتيب
        $sortField = $request->input('sort_by', 'id');
        $sortDirection = $request->input('sort_dir', 'desc');
        $allowedSortFields = ['id', 'created_at', 'make', 'model', 'year', 'odometer', 'evaluation_price'];
        if (in_array($sortField, $allowedSortFields, true)) {
            $query->orderBy($sortField, $sortDirection);
        }

        $cars = $query->paginate(10);

        return response()->json([
            'status' => 'success',
            'data'   => $cars,
        ]);
    }

    /**
     * سيارات لها مزاد نشط (محمي)
     */
    public function CarsInAuction(Request $request)
    {
        $query = Car::with(['activeAuction'])->whereHas('activeAuction');

        if ($request->filled('market_category')) {
            $query->where('market_category', $request->market_category);
        }

        // only_approved يعمل فقط لو عندنا عمود status في cars
        if ($request->boolean('only_approved') && Schema::hasColumn('cars', 'status')) {
            $query->where('status', 'approved');
        }

        $cars = $query->paginate(10);
        $carCollection = new CarCollection($cars);
        $payload = $carCollection->toResponse(request())->getData(true);

        return response()->json([
            'status'     => 'success',
            'data'       => $payload['data'],
            'pagination' => $payload['pagination'],
        ]);
    }

    /**
     * سيارات مميزة (عام)
     */
    public function getFeaturedCars(Request $request)
    {
        $activeStatuses = ['active', 'live'];
        try { $activeStatuses[] = AuctionStatus::ACTIVE->value; } catch (\Throwable $e) {}

        $cars = Car::with('activeAuction')
            ->select('id', 'make', 'model', 'year', 'images', 'evaluation_price', 'market_category')
            ->when(Schema::hasColumn('cars', 'status'), function ($q) {
                $q->where('status', 'approved');
            })
            ->whereHas('activeAuction', function ($q) use ($activeStatuses) {
                $q->whereIn('status', array_unique($activeStatuses));
            })
            ->withCount('activeAuctionBids as total_bids')
            ->orderBy('total_bids', 'DESC')
            ->limit(4)
            ->get();

        return response()->json([
            'status' => 'success',
            'data'   => $cars,
        ]);
    }

    /**
     * سيارات أضافها التاجر (محمي)
     */
    public function getAddedCars(Request $request)
    {
        $user = Auth::user();
        $query = Car::query();

        if ($user->role === 'dealer' && $user->dealer) {
            $query->where('dealer_id', $user->dealer->id);
        } else {
            $query->where('user_id', $user->id);
        }

        $cars = $query->paginate(10);

        return response()->json([
            'status' => 'success',
            'data'   => $cars,
        ]);
    }

    /**
     * إضافة سيارة (محمي)
     */
    public function store(Request $request)
    {
        Log::info('Car store request data:', [
            'all_data'          => $request->all(),
            'files'             => $request->allFiles(),
            'has_images_field'  => $request->has('images'),
            'has_file_images'   => $request->hasFile('images'),
        ]);

        // تطبيع القيم العشرية
        $normalized = $request->all();
        foreach (['evaluation_price', 'min_price', 'max_price'] as $key) {
            if (isset($normalized[$key]) && is_string($normalized[$key])) {
                $normalized[$key] = str_replace(',', '.', $normalized[$key]);
            }
        }
        $request->merge($normalized);

        // أسواق مسموح بها (من غير government)
        $allowedMarkets = array_values(array_filter(CarsMarketsCategory::values(), fn ($v) => $v !== 'government'));

        $rules = [
            'make'       => 'required|string|max:50',
            'model'      => 'required|string|max:50',
            'year'       => 'required|integer|min:1900|max:' . (date('Y') + 1),
            'vin'        => 'required|string|unique:cars,vin|max:17',
            'odometer'   => 'required|integer|min:0|max:2147483647',
            'condition'  => ['required', 'string', Rule::in(CarCondition::values())],
            'main_auction_duration' => 'nullable|integer|in:5,7',

            'evaluation_price' => 'required|numeric|min:0|max:9999999999.99',
            'min_price'        => 'required|numeric|min:0|max:9999999999.99',
            'max_price'        => 'required|numeric|min:0|max:9999999999.99',

            'color'        => 'nullable|string|max:30',
            'province'     => 'nullable|string|max:100',
            'city'         => 'nullable|string|max:100',
            'engine'       => 'nullable|string|max:50',
            'transmission' => ['nullable', 'string', Rule::in(CarTransmission::values())],
            'market_category' => ['required', 'string', Rule::in($allowedMarkets)],
            'description'  => 'nullable|string',

            'images'    => 'sometimes|array|max:10',
        ];

        [$messages, $attributes] = $this->arabicValidation();

        $validator = Validator::make($request->all(), $rules, $messages, $attributes);
        $validator->after(function ($v) use ($request) {
            if ($request->filled(['min_price', 'max_price']) && (float)$request->min_price > (float)$request->max_price) {
                $v->errors()->add('min_price', 'الحد الأدنى يجب أن يكون أقل من أو يساوي الحد الأعلى.');
            }
        });
        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        $user = Auth::user();
        $car = new Car();

        if ($user->role === 'dealer' && $user->dealer) {
            $car->dealer_id = $user->dealer->id;
        }
        $car->user_id = $user->id;

        // حفظ القيم
        $car->make = $request->make;
        $car->province = $request->province;
        $car->city = $request->city;
        $car->model = $request->model;
        $car->year = $request->year;
        $car->vin = $request->vin;
        $car->odometer = $request->odometer;
        $car->condition = CarCondition::from($request->condition);
        $car->evaluation_price = $request->evaluation_price;
        $car->color = $request->color ?? null;
        $car->engine = $request->engine ?? null;
        $car->transmission = $request->transmission ? CarTransmission::from($request->transmission) : null;
        $car->description = $request->description ?? null;
        $car->plate = $request->plate ?? null;
        $car->auction_status = 'available';
        $car->min_price = $request->min_price;
        $car->max_price = $request->max_price;
        $car->market_category = $request->market_category;
        $car->main_auction_duration = $request->main_auction_duration;
        $car->save();

        // صور السيارة
        $this->logImageDebugInfo($request);
        $uploadedImages = $this->handleCarImageUpload($request, $car);
        if (!empty($uploadedImages)) {
            $car->images = $uploadedImages;
            $car->save();
        }

        // صور التقارير
        $uploadedReportImages = $this->handleCarReportImageUpload($request, $car);
        if (!empty($uploadedReportImages)) {
            $car->reportImages()->createMany($uploadedReportImages);
            $car->save();
        }

        // بطاقة التسجيل
        if ($request->hasFile('registration_card_image')) {
            $image = $request->file('registration_card_image');
            $publicId = 'car_' . $car->id . '_' . time() . '_' . rand(1000, 9999);
            $uploadedRegistrationCardImage = $this->cloudinaryService->uploadImage($image, 'cars', $publicId);
            $car->registration_card_image = $uploadedRegistrationCardImage;
            $car->save();
        }

        // إشعار الإدمنز
        $car->refresh();
        $admins = User::where('role', 'admin')->get();
        Notification::send($admins, new NewCarAddedNotification($car->load('user')));

        return response()->json([
            'status'  => 'success',
            'message' => 'تم إضافة السيارة بنجاح.',
            'data'    => $car,
        ], 201);
    }

    /**
     * عرض سيارة (محمي)
     */
    public function show($id)
    {
        $user = Auth::user();

        if ($user->role === 'admin') {
            $car = Car::find($id);
        } elseif ($user->role === 'dealer' && $user->dealer) {
            $car = Car::where('id', $id)->where('dealer_id', $user->dealer->id)->first();
        } else {
            $car = Car::where('id', $id)->where('user_id', $user->id)->first();
        }

        if (!$car) {
            return response()->json(['status' => 'error', 'message' => 'السيارة غير موجودة أو ليست لديك صلاحية لعرضها.'], 404);
        }

        $activeAuction = $car->auctions()
            ->whereIn('status', [AuctionStatus::SCHEDULED->value, AuctionStatus::ACTIVE->value])
            ->first();

        return response()->json([
            'status' => 'success',
            'data'   => ['car' => $car, 'active_auction' => $activeAuction],
        ]);
    }

    /**
     * عرض سيارة (للعرض فقط) (محمي)
     */
    public function showOnly($id)
    {
        $user = Auth::user();
        $car = Car::with('reportImages','activeAuction')->find($id);

        if ($car) {
            $car->load('dealer');
        }

        if (!$car) {
            return response()->json(['status' => 'error', 'message' => 'السيارة غير موجودة.'], 404);
        }

        $activeAuction = $car->activeAuction()
        ->withCount('bids')
        ->first();
        $total_bids = $activeAuction?->bids_count ?? 0;
        if ($activeAuction && $activeAuction->auction_type != AuctionType::SILENT_INSTANT) {
            $activeAuction->load(['bids' => function ($q) {
                $q->select('id', 'bid_amount', 'created_at', 'user_id', 'auction_id')
                    ->orderBy('created_at', 'desc');
            }]);

           // $total_bids = $activeAuction ? $activeAuction->bids->count() : 0;
        }

        $similar_cars = Car::where('make', $car->make)
            ->where('id', '!=', $car->id)
            ->whereHas('activeAuction')
            ->with('activeAuction')
            ->withCount('activeAuctionBids as total_bids')
            ->orderByRaw('model = ? DESC', [$car->model])
            ->orderBy('year', 'DESC')
            ->limit(4)
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'car' => $car,
                'active_auction' => $activeAuction,
                'similar_cars' => $similar_cars,
                'total_bids' => $total_bids
            ]
        ]);
    }

    /**
     * تحديث سيارة (محمي)
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();

        if ($user->role === 'dealer' && $user->dealer) {
            $car = Car::where('id', $id)->where('dealer_id', $user->dealer->id)->first();
        } else {
            $car = Car::where('id', $id)->where('user_id', $user->id)->first();
        }

        if (!$car) {
            return response()->json(['status' => 'error', 'message' => 'السيارة غير موجودة أو ليست لديك صلاحية لتعديلها.'], 404);
        }

        if (in_array($car->auction_status, ['scheduled', 'active'], true)) {
            return response()->json(['status' => 'error', 'message' => 'لا يمكن تعديل بيانات السيارة أثناء وجود مزاد نشط أو مجدول.'], 400);
        }

        // تطبيع أرقام
        $normalized = $request->all();
        foreach (['evaluation_price', 'min_price', 'max_price'] as $key) {
            if (isset($normalized[$key]) && is_string($normalized[$key])) {
                $normalized[$key] = str_replace(',', '.', $normalized[$key]);
            }
        }
        $request->merge($normalized);

        $allowedMarkets = array_values(array_filter(CarsMarketsCategory::values(), fn ($v) => $v !== 'government'));

        $rules = [
            'make'       => 'sometimes|string|max:50',
            'model'      => 'sometimes|string|max:50',
            'year'       => 'sometimes|integer|min:1900|max:' . (date('Y') + 1),
            'vin'        => 'sometimes|string|unique:cars,vin,' . $id . '|max:17',
            'odometer'   => 'sometimes|integer|min:0|max:2147483647',
            'condition'  => ['sometimes', 'string', Rule::in(CarCondition::values())],

            'evaluation_price' => 'sometimes|numeric|min:0|max:9999999999.99',
            'min_price'        => 'sometimes|numeric|min:0|max:9999999999.99',
            'max_price'        => 'sometimes|numeric|min:0|max:9999999999.99',

            'color'        => 'nullable|string|max:30',
            'engine'       => 'nullable|string|max:50',
            'transmission' => ['nullable', 'string', Rule::in(CarTransmission::values())],
            'description'  => 'nullable|string',
            'province'     => 'nullable|string|max:100',
            'city'         => 'nullable|string|max:100',
            'plate'        => 'nullable|string|max:20',
            'market_category' => ['sometimes', 'string', Rule::in($allowedMarkets)],
        ];

        [$messages, $attributes] = $this->arabicValidation();

        $validator = Validator::make($request->all(), $rules, $messages, $attributes);
        $validator->after(function ($v) use ($request) {
            if ($request->filled(['min_price', 'max_price']) && (float)$request->min_price > (float)$request->max_price) {
                $v->errors()->add('min_price', 'الحد الأدنى يجب أن يكون أقل من أو يساوي الحد الأعلى.');
            }
        });
        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        // تحديث الحقول
        foreach ([
            'make','model','year','vin','odometer','evaluation_price','color','engine',
            'description','province','city','plate','min_price','max_price','market_category'
        ] as $field) {
            if ($request->has($field)) $car->{$field} = $request->{$field};
        }
        if ($request->has('condition'))    $car->condition = CarCondition::from($request->condition);
        if ($request->has('transmission')) $car->transmission = $request->transmission ? CarTransmission::from($request->transmission) : null;

        // صور (اختياري)
        if ($request->hasFile('images')) {
            $uploadedImages = [];
            foreach ($request->file('images') as $image) {
                try {
                    $publicId  = 'car_' . $car->id . '_' . time() . '_' . rand(1000, 9999);
                    $imageUrl  = $this->cloudinaryService->uploadImage($image, 'cars', $publicId);
                    $uploadedImages[] = $imageUrl;
                } catch (\Exception $e) {
                    Log::error('Error uploading image: ' . $e->getMessage());
                }
            }

            if ($request->boolean('keep_existing_images', false)) {
                $existing = $car->images ?? [];
                $car->images = array_values(array_merge($existing, $uploadedImages));
            } else {
                $car->images = $uploadedImages;
            }
        }

        $car->save();
        Cache::flush();

        return response()->json([
            'status'  => 'success',
            'message' => 'تم تحديث بيانات السيارة بنجاح.',
            'data'    => $car,
        ]);
    }

    /**
     * حذف سيارة (محمي)
     */
    public function destroy($id)
    {
        $user = Auth::user();

        if ($user->role === 'dealer' && $user->dealer) {
            $car = Car::where('id', $id)->where('dealer_id', $user->dealer->id)->first();
        } else {
            $car = Car::where('id', $id)->where('user_id', $user->id)->first();
        }

        if (!$car) {
            return response()->json(['status' => 'error', 'message' => 'السيارة غير موجودة أو ليست لديك صلاحية لحذفها.'], 404);
        }

        $activeAuctionExists = $car->auctions()
            ->whereIn('status', [AuctionStatus::SCHEDULED->value, AuctionStatus::ACTIVE->value])
            ->exists();

        if ($activeAuctionExists) {
            return response()->json(['status' => 'error', 'message' => 'لا يمكن حذف السيارة لوجود مزاد نشط أو مجدول عليها.'], 400);
        }

        $car->delete();

        return response()->json(['status' => 'success', 'message' => 'تم حذف السيارة بنجاح.']);
    }

    /**
     * إحصائيات (محمي)
     */
    public function statistics()
    {
        $user = Auth::user();

        $query = ($user->role === 'dealer' && $user->dealer)
            ? Car::where('dealer_id', $user->dealer->id)
            : Car::where('user_id', $user->id);

        $totalCars = $query->count();

        $carsByCondition = (clone $query)
            ->selectRaw('condition, COUNT(*) as count')
            ->groupBy('condition')
            ->get();

        $carsByAuctionStatus = (clone $query)
            ->selectRaw('auction_status, COUNT(*) as count')
            ->groupBy('auction_status')
            ->get();

        $inventoryValue = (clone $query)->sum('evaluation_price');

        $recentCars = (clone $query)->orderBy('created_at', 'desc')->take(5)->get();

        return response()->json([
            'status' => 'success',
            'data'   => [
                'total_cars'            => $totalCars,
                'cars_by_condition'     => $carsByCondition,
                'cars_by_auction_status'=> $carsByAuctionStatus,
                'total_inventory_value' => $inventoryValue,
                'recent_cars'           => $recentCars,
            ]
        ]);
    }

    /**
     * عام: قائمة سيارات لسوق محدد (Active Auction) + (اختياري approved لو العمود موجود)
     * GET /api/market/cars?market=trucks|buses|...
     */
    public function publicMarketCars(Request $request)
    {
        try {
            $perPage = max(1, min((int)$request->query('per_page', 12), 48));
            $market  = $request->query('market', $request->route('market')); // يدعم defaults في الراوت

            if (!$market) {
                return response()->json(['status' => 'error', 'message' => 'باراميتر market مطلوب.'], 422);
            }

            $enumValues = CarsMarketsCategory::values();

            // منع الحكومة
            if (strtolower($market) === 'government') {
                return response()->json([
                    'status'     => 'success',
                    'data'       => [],
                    'pagination' => ['total' => 0, 'per_page' => $perPage, 'current_page' => 1, 'last_page' => 1],
                    'filters'    => ['market' => 'government (blocked)'],
                ], 200);
            }

            // تطبيع مع دعم الفصل القديم/الجديد
            $normalize = function (string $m) use ($enumValues) {
                $m = strtolower(trim($m));
                if (in_array($m, $enumValues, true)) return $m;
                $aliases = [
                    'luxury'        => 'luxuryCars',
                    'luxurycars'    => 'luxuryCars',
                    'caravans'      => 'caravan',
                    'companies'     => 'companiesCars',
                    'companiescars' => 'companiesCars',
                    'trucks'        => in_array('trucks', $enumValues, true) ? 'trucks' : (in_array('busesTrucks', $enumValues, true) ? 'busesTrucks' : null),
                    'buses'         => in_array('buses',  $enumValues, true) ? 'buses'  : (in_array('busesTrucks', $enumValues, true) ? 'busesTrucks' : null),
                ];
                return $aliases[$m] ?? null;
            };

            $marketValue = $normalize($market);
            if (!$marketValue) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'قيمة market غير صحيحة.',
                    'allowed' => $enumValues,
                ], 422);
            }

            $activeStatuses = ['active', 'live'];
            try { $activeStatuses[] = AuctionStatus::ACTIVE->value; } catch (\Throwable $e) {}

            $query = Car::query()
                ->select('id', 'make', 'model', 'year', 'images', 'evaluation_price', 'market_category')
                ->where('market_category', $marketValue)
                ->when(Schema::hasColumn('cars', 'status'), function ($q) {
                    $q->where('status', 'approved');
                })
                ->whereHas('activeAuction', function ($q) use ($activeStatuses) {
                    $q->whereIn('status', array_unique($activeStatuses));
                })
                ->with(['activeAuction' => function ($q) {
                    $q->select('id', 'car_id', 'current_price', 'status');
                }])
                ->withCount('activeAuctionBids as total_bids')
                ->orderByDesc('total_bids')
                ->orderBy('year', 'desc');

            $cars = $query->paginate($perPage);

            $collection = new CarCollection($cars);
            $payload = $collection->toResponse(request())->getData(true);

            return response()->json([
                'status'     => 'success',
                'data'       => $payload['data'],
                'pagination' => $payload['pagination'],
                'filters'    => ['market' => $marketValue],
            ], 200);
        } catch (\Throwable $e) {
            Log::error('publicMarketCars failed', [
                'error' => $e->getMessage(),
                'line'  => $e->getLine(),
                'file'  => $e->getFile(),
            ]);
            return response()->json(['message' => 'Server Error'], 500);
        }
    }

    /**
     * enum options للفرونت (محمي)
     */
    public function enumOptions()
    {
        $allMarkets = CarsMarketsCategory::values();
        $allowedForCreate = array_values(array_filter($allMarkets, fn ($v) => $v !== 'government'));

        $translations = [];
        try {
            if (method_exists(CarsMarketsCategory::class, 'getTranslations')) {
                $translations = CarsMarketsCategory::getTranslations();
                if (is_array($translations)) {
                    $translations = array_filter($translations, fn($k) => $k !== 'government', ARRAY_FILTER_USE_KEY);
                } else {
                    $translations = [];
                }
            }
        } catch (\Throwable $e) {
            $translations = [];
        }

        return response()->json([
            'status' => 'success',
            'data'   => [
                'markets_all'          => $allMarkets,
                'markets_allowed'      => $allowedForCreate,
                'markets_translations' => $translations,
                'conditions'           => CarCondition::values(),
                'transmissions'        => CarTransmission::values(),
            ]
        ]);
    }

    /* ====== Helpers: Images & Validation ====== */

    private function logImageDebugInfo(Request $request)
    {
        Log::info('Image request information:', [
            'has_images_field'       => $request->has('images'),
            'has_images_file'        => $request->hasFile('images'),
            'files_in_request'       => array_keys($request->allFiles()),
            'request_content_type'   => $request->header('Content-Type')
        ]);
    }

    private function handleCarImageUpload(Request $request, Car $car)
    {
        $uploadedImages = [];
        if (!$request->hasFile('images')) return $uploadedImages;

        foreach ($request->file('images') as $image) {
            $publicId = 'car_' . $car->id . '_' . time() . '_' . rand(1000, 9999);
            $imageUrl = $this->cloudinaryService->uploadImage($image, 'cars', $publicId);
            $uploadedImages[] = $imageUrl;
        }
        return $uploadedImages;
    }

    private function handleCarReportImageUpload(Request $request, Car $car)
    {
        $uploadedImages = [];
        if (!$request->hasFile('reports_images')) return $uploadedImages;

        foreach ($request->file('reports_images') as $image) {
            $publicId = 'car_' . $car->id . '_' . time() . '_' . rand(1000, 9999);
            $imageUrl = $this->cloudinaryService->uploadImage($image, 'cars', $publicId);
            $uploadedImages[] = [
                'car_id'     => $car->id,
                'image_path' => $imageUrl,
                'file_size'  => $image->getSize(),
            ];
        }
        return $uploadedImages;
    }

    private function arabicValidation(): array
    {
        $messages = [
            'required' => 'حقل :attribute مطلوب.',
            'string'   => 'حقل :attribute يجب أن يكون نصًا.',
            'integer'  => 'حقل :attribute يجب أن يكون رقمًا صحيحًا.',
            'numeric'  => 'حقل :attribute يجب أن يكون رقمًا.',
            'array'    => 'حقل :attribute يجب أن يكون مصفوفة.',
            'max.numeric' => 'حقل :attribute يجب ألا يتجاوز :max.',
            'max.string'  => 'حقل :attribute يجب ألا يزيد عن :max حرفًا.',
            'min.numeric' => 'حقل :attribute يجب ألا يقل عن :min.',
            'min.string'  => 'حقل :attribute يجب ألا يقل عن :min حروف.',
            'in'       => 'القيمة المختارة لحقل :attribute غير صحيحة.',
            'unique'   => 'قيمة :attribute مستخدمة من قبل.',
            'mimes'    => 'نوع الملف في :attribute غير مدعوم. الأنواع المسموحة: :values.',
            'image'    => 'الملف في :attribute يجب أن يكون صورة.',
            'date'     => 'حقل :attribute يجب أن يكون تاريخًا صحيحًا.',
        ];

        $attributes = [
            'make' => 'العلامة التجارية',
            'model' => 'الموديل',
            'year' => 'سنة الصنع',
            'vin' => 'رقم الهيكل (VIN)',
            'odometer' => 'عداد الكيلومترات',
            'condition' => 'الحالة',
            'evaluation_price' => 'سعر التقييم',
            'min_price' => 'الحد الأدنى',
            'max_price' => 'الحد الأعلى',
            'color' => 'اللون',
            'engine' => 'سعة المحرك',
            'transmission' => 'ناقل الحركة',
            'description' => 'الوصف',
            'province' => 'المحافظة',
            'city' => 'المدينة',
            'plate' => 'رقم اللوحة',
            'market_category' => 'فئة السوق',
            'images' => 'الصور',
            'images.*' => 'ملف الصورة',
            'registration_card_image' => 'استمارة المركبة',
        ];

        return [$messages, $attributes];
    }
}

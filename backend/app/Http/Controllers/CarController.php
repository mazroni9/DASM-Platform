<?php

namespace App\Http\Controllers;

use App\Models\Car;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Dealer;
use App\Enums\CarCondition;
use App\Enums\AuctionStatus;
use Illuminate\Http\Request;
use App\Enums\CarTransmission;
use Illuminate\Validation\Rule;
use App\Enums\CarsMarketsCategory;
use App\Services\CloudinaryService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Http\Resources\CarCardResource;
use App\Http\Resources\CarCollection;
use App\Models\Auction;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;
use App\Models\User;
use App\Notifications\NewCarAddedNotification;
use Illuminate\Support\Facades\Notification;

class CarController extends Controller
{
    /**
     * CloudinaryService instance
     *
     * @var CloudinaryService
     */
    protected $cloudinaryService;

    public function __construct(CloudinaryService $cloudinaryService)
    {
        $this->cloudinaryService = $cloudinaryService;
    }

    /**
     * عرض سيارات المستخدم
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        // تاجر أو مستخدم عادي
        $query = Car::where('user_id', $user->id);
        if ($user->role === 'dealer' && $user->dealer) {
            // لو المستخدم تاجر ومعاه dealer، نقيّد على المعرض
            $query->where('dealer_id', $user->dealer->id);
        }

        $query->with('auctions');

        // فلاتر اختيارية
        if ($request->has('condition')) {
            $query->where('condition', $request->condition);
        }
        if ($request->has('auction_status')) {
            $query->where('auction_status', $request->auction_status);
        }
        if ($request->has('make')) {
            $query->where('make', 'like', '%' . $request->make . '%');
        }
        if ($request->has('model')) {
            $query->where('model', 'like', '%' . $request->model . '%');
        }
        if ($request->has('year')) {
            $query->where('year', $request->year);
        }

        // ترتيب
        $sortField = $request->input('sort_by', 'id');
        $sortDirection = $request->input('sort_dir', 'desc');
        $allowedSortFields = ['id', 'created_at', 'make', 'model', 'year', 'odometer', 'evaluation_price'];

        if (in_array($sortField, $allowedSortFields)) {
            $query->orderBy($sortField, $sortDirection);
        }

        $cars = $query->paginate(10);

        return response()->json([
            'status' => 'success',
            'data' => $cars
        ]);
    }

    /**
     * سيارات لها مزاد نشط
     */
    public function CarsInAuction(Request $request)
    {
        $query = Car::with(['activeAuction'])->whereHas('activeAuction');

        if ($request->has('market_category')) {
            $query->where('market_category', $request->market_category);
        }

        $cars = $query->paginate(10);
        $carCollection = new CarCollection($cars);
        $responseData = $carCollection->toResponse(request())->getData(true);

        return response()->json([
            'status' => 'success',
            'data' => $responseData['data'],
            'pagination' => $responseData['pagination']
        ]);
    }

    public function getFeaturedCars(Request $request)
    {

        $cars = Car::with('activeAuction')
        ->select('id', 'make', 'model', 'year', 'images', 'evaluation_price')
        ->whereHas('activeAuction')
        ->withCount('activeAuctionBids as total_bids')
        ->orderBy('total_bids', 'DESC')
        ->limit(4)
        ->get();
        return response()->json([
            'status' => 'success',
            'data' => $cars
        ]);
    }
    /**
     * سيارات أضافها التاجر
     */
    public function getAddedCars(Request $request)
    {
        $user = Auth::user();

        // ابدأ بـ Query Builder لتفادي null
        $query = Car::query();

        if ($user->role === 'dealer' && $user->dealer) {
            // سيارات المعرض الخاص بالتاجر
            $query->where('dealer_id', $user->dealer->id);
        } else {
            //Fallback منطقي: سيارات المستخدم نفسه
            $query->where('user_id', $user->id);
        }

        $cars = $query->paginate(10);

        return response()->json([
            'status' => 'success',
            'data' => $cars
        ]);
    }

    /**
     * إضافة سيارة جديدة
     */
    public function store(Request $request)
    {
        // لوج توضيحي
        Log::info('Car store request data:', [
            'all_data' => $request->all(),
            'files' => $request->allFiles(),
            'images_exists' => $request->has('images'),
            'images_is_array' => is_array($request->input('images')),
            'has_file_images' => $request->hasFile('images'),
            'file_images_count' => $request->hasFile('images') ? count($request->file('images')) : 0,
        ]);

        // تطبيع القيم العشرية: استبدال الفاصلة بنقطة
        $normalized = $request->all();
        foreach (['evaluation_price', 'min_price', 'max_price'] as $key) {
            if (isset($normalized[$key]) && is_string($normalized[$key])) {
                $normalized[$key] = str_replace(',', '.', $normalized[$key]);
            }
        }
        $request->merge($normalized);

        // قواعد
        $rules = [
            'make' => 'required|string|max:50',
            'model' => 'required|string|max:50',
            'year' => 'required|integer|min:1900|max:' . (date('Y') + 1),
            'vin' => 'required|string|unique:cars,vin|max:17',
            'odometer' => 'required|integer|min:0|max:2147483647',
            'condition' => ['required', 'string', Rule::in(CarCondition::values())],
            'main_auction_duration' => 'nullable|integer|in:5,7',

            // تمنع Overflow
            'evaluation_price' => 'required|numeric|min:0|max:9999999999.99',
            'min_price' => 'required|numeric|min:0|max:9999999999.99',
            'max_price' => 'required|numeric|min:0|max:9999999999.99',

            // نصوص
            'color' => 'nullable|string|max:30',
            'province' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
            'engine' => 'nullable|string|max:50',

            'transmission' => ['nullable', 'string', Rule::in(CarTransmission::values())],
            'market_category' => ['required', 'string', Rule::in(CarsMarketsCategory::values())],
            'description' => 'nullable|string',

            // صور اختيارية
            'images' => 'sometimes|array|max:10',
            //'images.*' => 'sometimes|image|mimes:jpeg,png,jpg,gif|max:5120',
        ];

        [$messages, $attributes] = $this->arabicValidation();

        $validator = Validator::make($request->all(), $rules, $messages, $attributes);

        // تحقق منطقي إضافي
        $validator->after(function ($v) use ($request) {
            if ($request->filled(['min_price', 'max_price']) && (float)$request->min_price > (float)$request->max_price) {
                $v->errors()->add('min_price', 'الحد الأدنى يجب أن يكون أقل من أو يساوي الحد الأعلى.');
            }
        });

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
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

        // صور (اختياري)
        $this->logImageDebugInfo($request);
        $uploadedImages = $this->handleCarImageUpload($request, $car);
        if (!empty($uploadedImages)) {
            $car->images = $uploadedImages;
            $car->save();
        }

        // صور تقارير (اختياري)
        $uploadedReportImages = $this->handleCarReportImageUpload($request, $car);
        if (!empty($uploadedReportImages)) {
            $car->reportImages()->createMany($uploadedReportImages);
            $car->save();
        }

        // بطاقة تسجيل (اختياري)
        if ($request->hasFile('registration_card_image')) {
            $image = $request->file('registration_card_image');
            $publicId = 'car_' . $car->id . '_' . time() . '_' . rand(1000, 9999);
            $uploadedRegistrationCardImage = $this->cloudinaryService->uploadImage($image, 'cars', $publicId);
            $car->registration_card_image = $uploadedRegistrationCardImage;
            $car->save();
        }

        // إرسال إشعار للمشرفين
        $car->refresh();
        $admins = User::where('role', 'admin')->get();
        Notification::send($admins, new NewCarAddedNotification($car->load('user')));

        return response()->json([
            'status' => 'success',
            'message' => 'تم إضافة السيارة بنجاح.',
            'data' => $car
        ], 201);
    }

    /**
     * عرض سيارة معيّنة
     */
    public function show($id)
    {
        $user = Auth::user();
        $car = null;

        if ($user->role === 'admin') {
            $car = Car::find($id);
        } elseif ($user->role === 'dealer' && $user->dealer) {
            $car = Car::where('id', $id)->where('dealer_id', $user->dealer->id)->first();
        } else {
            $car = Car::where('id', $id)->where('user_id', $user->id)->first();
        }

        if (!$car) {
            return response()->json([
                'status' => 'error',
                'message' => 'السيارة غير موجودة أو ليست لديك صلاحية لعرضها.'
            ], 404);
        }

        $activeAuction = $car->auctions()
            ->whereIn('status', [AuctionStatus::SCHEDULED->value, AuctionStatus::ACTIVE->value])
            ->first();

        return response()->json([
            'status' => 'success',
            'data' => [
                'car' => $car,
                'active_auction' => $activeAuction
            ]
        ]);
    }

    /**
     * عرض سيارة (للعرض فقط)
     */
    public function showOnly($id)
    {
        $user = Auth::user();
        $car = Car::with('reportImages')->find($id);

        if ($car) {
            $car->load('dealer');
        }

        if (!$car) {
            return response()->json([
                'status' => 'error',
                'message' => 'السيارة غير موجودة.'
            ], 404);
        }

        $activeAuction = $car->activeAuction()
            ->with(['bids' => function ($q) {
                $q->select('id', 'bid_amount', 'created_at', 'user_id', 'auction_id')
                    ->orderBy('created_at', 'desc');
            }])
            ->first();

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
                'total_bids' => $activeAuction ? $activeAuction->bids->count() : 0
            ]
        ]);
    }

    /**
     * تحديث سيارة
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $car = null;

        if ($user->role === 'dealer' && $user->dealer) {
            $car = Car::where('id', $id)->where('dealer_id', $user->dealer->id)->first();
        } else {
            $car = Car::where('id', $id)->where('user_id', $user->id)->first();
        }

        if (!$car) {
            return response()->json([
                'status' => 'error',
                'message' => 'السيارة غير موجودة أو ليست لديك صلاحية لتعديلها.'
            ], 404);
        }

        if (in_array($car->auction_status, ['scheduled', 'active'])) {
            return response()->json([
                'status' => 'error',
                'message' => 'لا يمكن تعديل بيانات السيارة أثناء وجود مزاد نشط أو مجدول.'
            ], 400);
        }

        // تطبيع الأرقام
        $normalized = $request->all();
        foreach (['evaluation_price', 'min_price', 'max_price'] as $key) {
            if (isset($normalized[$key]) && is_string($normalized[$key])) {
                $normalized[$key] = str_replace(',', '.', $normalized[$key]);
            }
        }
        $request->merge($normalized);

        $rules = [
            'make' => 'sometimes|string|max:50',
            'model' => 'sometimes|string|max:50',
            'year' => 'sometimes|integer|min:1900|max:' . (date('Y') + 1),
            'vin' => 'sometimes|string|unique:cars,vin,' . $id . '|max:17',
            'odometer' => 'sometimes|integer|min:0|max:2147483647',
            'condition' => 'sometimes|string|in:excellent,good,fair,poor',

            'evaluation_price' => 'sometimes|numeric|min:0|max:9999999999.99',
            'min_price' => 'sometimes|numeric|min:0|max:9999999999.99',
            'max_price' => 'sometimes|numeric|min:0|max:9999999999.99',

            'color' => 'nullable|string|max:30',
            'engine' => 'nullable|string|max:50',
            'transmission' => 'nullable|string|in:automatic,manual,cvt',
            'description' => 'nullable|string',
            'province' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
            'plate' => 'nullable|string|max:20',
            'market_category' => ['sometimes', 'string', Rule::in(CarsMarketsCategory::values())],
        ];

        [$messages, $attributes] = $this->arabicValidation();

        $validator = Validator::make($request->all(), $rules, $messages, $attributes);

        $validator->after(function ($v) use ($request) {
            if ($request->filled(['min_price', 'max_price']) && (float)$request->min_price > (float)$request->max_price) {
                $v->errors()->add('min_price', 'الحد الأدنى يجب أن يكون أقل من أو يساوي الحد الأعلى.');
            }
        });

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        // تحديث الحقول المسموح بها
        if ($request->has('make')) $car->make = $request->make;
        if ($request->has('model')) $car->model = $request->model;
        if ($request->has('year')) $car->year = $request->year;
        if ($request->has('vin')) $car->vin = $request->vin;
        if ($request->has('odometer')) $car->odometer = $request->odometer;
        if ($request->has('condition')) $car->condition = $request->condition;
        if ($request->has('evaluation_price')) $car->evaluation_price = $request->evaluation_price;
        if ($request->has('color')) $car->color = $request->color;
        if ($request->has('engine')) $car->engine = $request->engine;
        if ($request->has('transmission')) $car->transmission = $request->transmission;
        if ($request->has('description')) $car->description = $request->description;
        if ($request->has('province')) $car->province = $request->province;
        if ($request->has('city')) $car->city = $request->city;
        if ($request->has('plate')) $car->plate = $request->plate;
        if ($request->has('min_price')) $car->min_price = $request->min_price;
        if ($request->has('max_price')) $car->max_price = $request->max_price;
        if ($request->has('market_category')) $car->market_category = $request->market_category;

        // رفع صور (اختياري)
        if ($request->hasFile('images')) {
            $uploadedImages = [];
            foreach ($request->file('images') as $image) {
                try {
                    $publicId = 'car_' . $car->id . '_' . time() . '_' . rand(1000, 9999);
                    $imageUrl = $this->cloudinaryService->uploadImage($image, 'cars', $publicId);
                    $uploadedImages[] = $imageUrl;
                } catch (\Exception $e) {
                    Log::error('Error uploading image: ' . $e->getMessage());
                    $uploadedImages[] = '/temp/car_' . $car->id . '_' . time() . '_' . rand(1000, 9999) . '.jpg';
                }
            }

            if ($request->has('keep_existing_images') && $request->keep_existing_images) {
                $existingImages = $car->images ?? [];
                $car->images = array_merge($existingImages, $uploadedImages);
            } else {
                $car->images = $uploadedImages;
            }
        }

        $car->save();

        Cache::flush();

        return response()->json([
            'status' => 'success',
            'message' => 'تم تحديث بيانات السيارة بنجاح.',
            'data' => $car
        ]);
    }

    /**
     * حذف سيارة
     */
    public function destroy($id)
    {
        $user = Auth::user();
        $car = null;

        if ($user->role === 'dealer' && $user->dealer) {
            $car = Car::where('id', $id)->where('dealer_id', $user->dealer->id)->first();
        } else {
            $car = Car::where('id', $id)->where('user_id', $user->id)->first();
        }

        if (!$car) {
            return response()->json([
                'status' => 'error',
                'message' => 'السيارة غير موجودة أو ليست لديك صلاحية لحذفها.'
            ], 404);
        }

        $activeAuction = $car->auctions()
            ->whereIn('status', [AuctionStatus::SCHEDULED->value, AuctionStatus::ACTIVE->value])
            ->exists();

        if ($activeAuction) {
            return response()->json([
                'status' => 'error',
                'message' => 'لا يمكن حذف السيارة لوجود مزاد نشط أو مجدول عليها.'
            ], 400);
        }

        $car->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'تم حذف السيارة بنجاح.'
        ]);
    }

    /**
     * إحصائيات عامة
     */
    public function statistics()
    {
        $user = Auth::user();
        $query = null;

        if ($user->role === 'dealer' && $user->dealer) {
            $query = Car::where('dealer_id', $user->dealer->id);
        } else {
            $query = Car::where('user_id', $user->id);
        }

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

        $recentCars = (clone $query)
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'total_cars' => $totalCars,
                'cars_by_condition' => $carsByCondition,
                'cars_by_auction_status' => $carsByAuctionStatus,
                'total_inventory_value' => $inventoryValue,
                'recent_cars' => $recentCars
            ]
        ]);
    }

    /**
     * لوج مساعدة للصور
     */
    private function logImageDebugInfo(Request $request)
    {
        Log::info('Image request information:', [
            'has_images_field' => $request->has('images'),
            'has_images_file' => $request->hasFile('images'),
            'has_images_array_field' => $request->has('images[]'),
            'has_images_array_file' => $request->hasFile('images[]'),
            'request_has_files' => $request->hasFile('images') || $request->hasFile('images[]'),
            'files_in_request' => array_keys($request->allFiles()),
            'request_content_type' => $request->header('Content-Type')
        ]);

        if ($request->hasFile('images')) {
            Log::info('Images detected', [
                'count' => is_array($request->file('images')) ? count($request->file('images')) : '1 (not array)'
            ]);
        }
    }

    /**
     * رفع إلى كلاوديناري (اختياري/احتياطي)
     */
    private function uploadToCloudinary($file, $carId)
    {
        try {
            $cloudName = config('cloudinary.cloud_name');
            $apiKey = config('cloudinary.api_key');
            $apiSecret = config('cloudinary.api_secret');

            Log::info('Cloudinary credentials check:', [
                'cloud_name' => $cloudName ?? 'not set',
                'api_key_exists' => !empty($apiKey) ? 'yes' : 'no',
                'api_secret_exists' => !empty($apiSecret) ? 'yes' : 'no',
            ]);

            if (empty($cloudName) || empty($apiKey) || empty($apiSecret)) {
                Log::error('Cloudinary credentials missing, using fallback');
                return '/temp/car_' . $carId . '_' . time() . '_' . rand(1000, 9999) . '.jpg';
            }

            // في حال تفعيل الرفع الحقيقي، ضع منطق الرفع هنا وأعد رابط الصورة
            return '/temp/car_' . $carId . '_' . time() . '_' . rand(1000, 9999) . '.jpg';
        } catch (\Exception $e) {
            Log::error('Cloudinary upload failed: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return '/temp/car_' . $carId . '_' . time() . '_' . rand(1000, 9999) . '.jpg';
        }
    }

    /**
     * رفع صور السيارة (اختياري)
     */
    private function handleCarImageUpload(Request $request, Car $car)
    {
        $uploadedImages = [];

        if (!$request->hasFile('images')) {
            Log::info('No images to upload for car', ['car_id' => $car->id]);
            return $uploadedImages;
        }

        Log::info('Processing images for car', [
            'car_id' => $car->id,
            'image_count' => count($request->file('images'))
        ]);

        foreach ($request->file('images') as $image) {
            $publicId = 'car_' . $car->id . '_' . time() . '_' . rand(1000, 9999);
            $imageUrl = $this->cloudinaryService->uploadImage($image, 'cars', $publicId);
            $uploadedImages[] = $imageUrl;

            Log::info('Image processed for car', [
                'car_id' => $car->id,
                'image_url' => $imageUrl,
                'original_name' => $image->getClientOriginalName()
            ]);
        }

        return $uploadedImages;
    }

    /**
     * رفع صور التقارير (اختياري)
     */
    private function handleCarReportImageUpload(Request $request, Car $car)
    {
        $uploadedImages = [];

        if (!$request->hasFile('reports_images')) {
            Log::info('No report images to upload for car', ['car_id' => $car->id]);
            return $uploadedImages;
        }

        foreach ($request->file('reports_images') as $image) {
            $publicId = 'car_' . $car->id . '_' . time() . '_' . rand(1000, 9999);
            $imageUrl = $this->cloudinaryService->uploadImage($image, 'cars', $publicId);
            $uploadedImages[] = [
                'car_id' => $car->id,
                'image_path' => $imageUrl,
                'file_size' => $image->getSize()
            ];

            Log::info('Report image processed for car', [
                'car_id' => $car->id,
                'image_url' => $imageUrl,
                'original_name' => $image->getClientOriginalName()
            ]);
        }

        return $uploadedImages;
    }

    /**
     * رسائل فاليديشن وأسماء الحقول بالعربي
     */
    private function arabicValidation(): array
    {
        $messages = [
            'required' => 'حقل :attribute مطلوب.',
            'string' => 'حقل :attribute يجب أن يكون نصًا.',
            'integer' => 'حقل :attribute يجب أن يكون رقمًا صحيحًا.',
            'numeric' => 'حقل :attribute يجب أن يكون رقمًا.',
            'array' => 'حقل :attribute يجب أن يكون مصفوفة.',
            'max.numeric' => 'حقل :attribute يجب ألا يتجاوز :max.',
            'max.string' => 'حقل :attribute يجب ألا يزيد عن :max حرفًا.',
            'min.numeric' => 'حقل :attribute يجب ألا يقل عن :min.',
            'min.string' => 'حقل :attribute يجب ألا يقل عن :min حروف.',
            'in' => 'القيمة المختارة لحقل :attribute غير صحيحة.',
            'unique' => 'قيمة :attribute مستخدمة من قبل.',
            'mimes' => 'نوع الملف في :attribute غير مدعوم. الأنواع المسموحة: :values.',
            'image' => 'الملف في :attribute يجب أن يكون صورة.',
            'date' => 'حقل :attribute يجب أن يكون تاريخًا صحيحًا.',
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

<?php

namespace App\Http\Controllers;

use App\Models\Car;
use App\Models\Dealer;
use App\Enums\AuctionStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use App\Services\CloudinaryService;
use Inertia\Response;
use Inertia\Inertia;

    // Helper function

class CarController extends Controller
{
    /**
     * CloudinaryService instance
     *
     * @var CloudinaryService
     */
    protected $cloudinaryService;

    /**
     * Create a new controller instance.
     *
     * @param CloudinaryService $cloudinaryService
     * @return void
     */
    public function __construct(CloudinaryService $cloudinaryService)
    {
        $this->cloudinaryService = $cloudinaryService;
    }

    /**
     * Display a listing of the user's cars
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $query = null;

        // Handle both user types: dealer or regular user
        if ($user->role === 'dealer' && $user->dealer) {
            $query = Car::where('dealer_id', $user->dealer->id);
        } else {
            $query = Car::where('user_id', $user->id);
        }


        $query->with('auctions');

        // Filter by condition
        if ($request->has('condition')) {
            $query->where('condition', $request->condition);
        }

        // Filter by auction status
        if ($request->has('auction_status')) {
            $query->where('auction_status', $request->auction_status);
        }

        // Filter by make
        if ($request->has('make')) {
            $query->where('make', 'like', '%' . $request->make . '%');
        }

        // Filter by model
        if ($request->has('model')) {
            $query->where('model', 'like', '%' . $request->model . '%');
        }

        // Filter by year
        if ($request->has('year')) {
            $query->where('year', $request->year);
        }

        // Sort options
        $sortField = $request->input('sort_by', 'id');
        $sortDirection = $request->input('sort_dir', 'desc');
        $allowedSortFields = ['id','created_at', 'make', 'model', 'year', 'odometer', 'evaluation_price'];

        if (in_array($sortField, $allowedSortFields)) {
            $query->orderBy($sortField, $sortDirection);
        }
        $cars= $query->paginate(10);


        return response()->json([
            'status' => 'success',
            'data' => $cars
        ]);




    }



    public function getAddedCars(Request $request)
    {
         $user = Auth::user();
         // Handle both user types: dealer or regular user
        if ($user->role === 'dealer' && $user->dealer) {
            $query = Car::where('dealer_id', $user->dealer->id);
        }

        $cars = $query->paginate(10);


        return response()->json([
            'status' => 'success',
            'data' => $cars
        ]);
    }

    /**
     * Store a newly created car
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    /**
     * Store a newly created car
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        // Debug: Log the incoming request data
        \Log::info('Car store request data:', [
            'all_data' => $request->all(),
            'files' => $request->allFiles(),
            'images_exists' => $request->has('images'),
            'images_is_array' => is_array($request->input('images')),
            'has_file_images' => $request->hasFile('images'),
            'file_images_count' => $request->hasFile('images') ? count($request->file('images')) : 0,
        ]);

        $validator = Validator::make($request->all(), [
            'make' => 'required|string|max:50',
            'model' => 'required|string|max:50',
            'year' => 'required|integer|min:1900|max:' . (date('Y') + 1),
            'vin' => 'required|string|unique:cars,vin|max:17',
            'odometer' => 'required|integer|min:0',
            'condition' => 'required|string|in:جديدة,ممتازة,جيدة جداً,جيدة,متوسطة,تحتاج إصلاح',
            'evaluation_price' => 'required|numeric|min:0',
            'color' => 'nullable|string|max:30',
            'engine' => 'nullable|string|max:50',
            'transmission' => 'nullable|string|in:أوتوماتيك,يدوي,نصف أوتوماتيك,cvt',
            'description' => 'nullable|string',
            'images' => 'sometimes|array|max:10',
            'images.*' => 'sometimes|image|mimes:jpeg,png,jpg,gif|max:5120',

        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();
        $car = new Car();

        // Associate car with dealer if user is dealer, otherwise with user directly
        if ($user->role === 'dealer' && $user->dealer) {
            $car->dealer_id = $user->dealer->id;
        } else {
            $car->user_id = $user->id;
        }

        // Map Arabic condition values to English database enum values
        $conditionMap = [
            'ممتازة' => 'excellent',
            'جديدة' => 'excellent',
            'جيدة جداً' => 'good',
            'جيدة' => 'good',
            'متوسطة' => 'fair',
            'تحتاج إصلاح' => 'poor'
        ];

        // Map Arabic transmission values to English database enum values
        $transmissionMap = [
            'أوتوماتيك' => 'automatic',
            'يدوي' => 'manual',
            'نصف أوتوماتيك' => 'cvt', // Map semi-automatic to CVT
            'cvt' => 'cvt'
        ];

        // Use the mapped values or fallback to defaults if no match
        $car->make = $request->make;
        $car->model = $request->model;
        $car->year = $request->year;
        $car->vin = $request->vin;
        $car->odometer = $request->odometer;
        $car->condition = $conditionMap[$request->condition] ?? 'good';
        $car->evaluation_price = $request->evaluation_price;
        $car->color = $request->color ?? null;
        $car->engine = $request->engine ?? null;
        $car->transmission = $transmissionMap[$request->transmission] ?? 'automatic';
        $car->description = $request->description ?? null;
        $car->plate = $request->plate ?? null;
        $car->auction_status = 'available';
         $car->min_price = $request->min_price;
         $car->max_price = $request->max_price;
        $car->save();

        // Log debug information about image files
        $this->logImageDebugInfo($request);

        // Handle car images upload with our improved method
        $uploadedImages = $this->handleCarImageUpload($request, $car);

        // If we have uploaded images, save them to the car
        if (!empty($uploadedImages)) {
            $car->images = $uploadedImages;
            $car->save();

            \Log::info('Images saved to car', [
                'car_id' => $car->id,
                'image_count' => count($uploadedImages)
            ]);
        }

        // Log summary information about the car and images
        \Log::info('Car created successfully', [
            'car_id' => $car->id,
            'make' => $car->make,
            'model' => $car->model,
            'images_saved' => !empty($uploadedImages) ? count($uploadedImages) : 0
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Car added successfully',
            'data' => $car
        ], 201);
    }

    /**
     * Display the specified car
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        $user = Auth::user();
        $car = null;

        // Allow admins to view any car
        if ($user->role === 'admin') {
            $car = Car::find($id);
        }
        // Retrieve car based on user role
        else if ($user->role === 'dealer' && $user->dealer) {
            $car = Car::where('id', $id)
                ->where('dealer_id', $user->dealer->id)
                ->first();
        } else {
            $car = Car::where('id', $id)
                ->where('user_id', $user->id)
                ->first();
        }

        if (!$car) {
            return response()->json([
                'status' => 'error',
                'message' => 'Car not found or you do not have permission to view it'
            ], 404);
        }

        // Get active auction if exists
        $activeAuction = $car->auctions()
            ->whereIn('status', [
                AuctionStatus::SCHEDULED->value,
                AuctionStatus::ACTIVE->value
            ])
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
     * Display the specified car
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function showOnly($id)
    {
        $user = Auth::user();
        $car = Car::find($id);
        $car->load('dealer');

        if (!$car) {
            return response()->json([
                'status' => 'error',
                'message' => 'Car not found or you do not have permission to view it',
                'data'=>$car
            ], 404);
        }

        // Get active auction if exists
        $activeAuction = $car->auctions()
            ->whereIn('status', [
                AuctionStatus::SCHEDULED->value,
                AuctionStatus::ACTIVE->value
            ])->first();

         $activeAuction?->load('bids');
        return response()->json([
            'status' => 'success',
            'data' => [
                'car' => $car,
                'active_auction' => $activeAuction,
                'total_bids' => $activeAuction?->bids->count()
            ]
        ]);
    }

    /**
     * Update the specified car
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $car = null;

        // Retrieve car based on user role
        if ($user->role === 'dealer' && $user->dealer) {
            $car = Car::where('id', $id)
                ->where('dealer_id', $user->dealer->id)
                ->first();
        } else {
            $car = Car::where('id', $id)
                ->where('user_id', $user->id)
                ->first();
        }

        if (!$car) {
            return response()->json([
                'status' => 'error',
                'message' => 'Car not found or you do not have permission to update it'
            ], 404);
        }

        // Prevent updates if car is in active auction
        if (in_array($car->auction_status, ['scheduled', 'active'])) {
            return response()->json([
                'status' => 'error',
                'message' => 'Cannot update car details while it is in an active or scheduled auction'
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'make' => 'sometimes|string|max:50',
            'model' => 'sometimes|string|max:50',
            'year' => 'sometimes|integer|min:1900|max:' . (date('Y') + 1),
            'vin' => 'sometimes|string|unique:cars,vin,' . $id . '|max:17',
            'odometer' => 'sometimes|integer|min:0',
            'condition' => 'sometimes|string|in:excellent,good,fair,poor',
            'evaluation_price' => 'sometimes|numeric|min:0',
            'color' => 'nullable|string|max:30',
            'engine' => 'nullable|string|max:50',
            'transmission' => 'nullable|string|in:automatic,manual,cvt',
            'description' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        // Update car fields that are allowed to be updated
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
         if ($request->has('min_price')) $car->min_price = $request->min_price;
          if ($request->has('max_price')) $car->max_price = $request->max_price;
        // Handle car images upload if any
        if ($request->hasFile('images')) {
            $uploadedImages = [];

            foreach ($request->file('images') as $image) {
                try {
                    // Use our CloudinaryService to handle uploads
                    $publicId = 'car_' . $car->id . '_' . time() . '_' . rand(1000, 9999);
                    $imageUrl = $this->cloudinaryService->uploadImage($image, 'cars', $publicId);

                    // Add the URL to the uploaded images array
                    $uploadedImages[] = $imageUrl;

                    \Log::info('Successfully uploaded car image', [
                        'image_url' => $imageUrl
                    ]);
                } catch (\Exception $e) {
                    \Log::error('Error uploading image: ' . $e->getMessage(), [
                        'exception' => get_class($e),
                        'file' => $e->getFile(),
                        'line' => $e->getLine()
                    ]);

                    // Use a local fallback path for testing
                    $uploadedImages[] = '/temp/car_' . $car->id . '_' . time() . '_' . rand(1000, 9999) . '.jpg';
                }
            }

            // If existing images should be kept, merge with new ones
            if ($request->has('keep_existing_images') && $request->keep_existing_images) {
                $existingImages = $car->images ?? [];
                $car->images = array_merge($existingImages, $uploadedImages);
            } else {
                $car->images = $uploadedImages;
            }
        }

        $car->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Car updated successfully',
            'data' => $car
        ]);
    }

    /**
     * Remove the specified car
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        $user = Auth::user();
        $car = null;

        // Retrieve car based on user role
        if ($user->role === 'dealer' && $user->dealer) {
            $car = Car::where('id', $id)
                ->where('dealer_id', $user->dealer->id)
                ->first();
        } else {
            $car = Car::where('id', $id)
                ->where('user_id', $user->id)
                ->first();
        }

        if (!$car) {
            return response()->json([
                'status' => 'error',
                'message' => 'Car not found or you do not have permission to delete it'
            ], 404);
        }

        // Check if car is in any active auctions
        $activeAuction = $car->auctions()
            ->whereIn('status', [
                AuctionStatus::SCHEDULED->value,
                AuctionStatus::ACTIVE->value
            ])
            ->exists();

        if ($activeAuction) {
            return response()->json([
                'status' => 'error',
                'message' => 'This car cannot be deleted as it is currently scheduled for or in an active auction'
            ], 400);
        }

        // Delete the car
        $car->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Car deleted successfully'
        ]);
    }

    /**
     * Get car statistics/dashboard for the user
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function statistics()
    {
        $user = Auth::user();
        $query = null;

        // Get stats based on user role
        if ($user->role === 'dealer' && $user->dealer) {
            $query = Car::where('dealer_id', $user->dealer->id);
        } else {
            $query = Car::where('user_id', $user->id);
        }

        // Total cars
        $totalCars = $query->count();

        // Cars by condition
        $carsByCondition = (clone $query)
            ->selectRaw('condition, COUNT(*) as count')
            ->groupBy('condition')
            ->get();

        // Cars by auction status
        $carsByAuctionStatus = (clone $query)
            ->selectRaw('auction_status, COUNT(*) as count')
            ->groupBy('auction_status')
            ->get();

        // Total inventory value
        $inventoryValue = (clone $query)
            ->sum('evaluation_price');

        // Recently added cars
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
     * Helper method to handle image upload debugging
     *
     * @param Request $request
     * @return void
     */
    private function logImageDebugInfo(Request $request)
    {
        \Log::info('Image request information:', [
            'has_images_field' => $request->has('images'),
            'has_images_file' => $request->hasFile('images'),
            'has_images_array_field' => $request->has('images[]'),
            'has_images_array_file' => $request->hasFile('images[]'),
            'request_has_files' => $request->hasFile('images') || $request->hasFile('images[]'),
            'files_in_request' => array_keys($request->allFiles()),
            'request_content_type' => $request->header('Content-Type')
        ]);

        if ($request->hasFile('images')) {
            \Log::info('Images detected', [
                'count' => is_array($request->file('images')) ? count($request->file('images')) : '1 (not array)'
            ]);
        }
    }

    /**
     * Handle upload to Cloudinary
     *
     * @param UploadedFile $file
     * @param int $carId
     * @return string Image URL
     */
    private function uploadToCloudinary($file, $carId)
    {
        try {
            // Get credentials from config (which now has hardcoded defaults)
            $cloudName = config('cloudinary.cloud_name');
            $apiKey = config('cloudinary.api_key');
            $apiSecret = config('cloudinary.api_secret');

            // Log the Cloudinary configuration for debugging
            \Log::info('Cloudinary credentials check:', [
                'cloud_name' => $cloudName ?? 'not set',
                'api_key_exists' => !empty($apiKey) ? 'yes' : 'no',
                'api_secret_exists' => !empty($apiSecret) ? 'yes' : 'no',
            ]);

            // Check if credentials are available
            if (empty($cloudName) || empty($apiKey) || empty($apiSecret)) {
                \Log::error('Cloudinary credentials missing, using fallback');
                return '/temp/car_' . $carId . '_' . time() . '_' . rand(1000, 9999) . '.jpg';
            }

            // Create Cloudinary configuration
            $config = new Configuration();
            $config->cloud->cloudName = $cloudName;
            $config->cloud->apiKey = $apiKey;
            $config->cloud->apiSecret = $apiSecret;
            $config->url->secure = true;

            // Initialize Cloudinary
            $cloudinary = new CloudinarySDK($config);

            // Upload file
            $result = $cloudinary->uploadApi()->upload(
                $file->getRealPath(),
                [
                    'folder' => 'cars',
                    'public_id' => 'car_' . $carId . '_' . time() . '_' . rand(1000, 9999)
                ]
            );

            \Log::info('Cloudinary upload successful', [
                'secure_url' => $result['secure_url'] ?? 'no url returned'
            ]);

            return $result['secure_url'];

        } catch (\Exception $e) {
            \Log::error('Cloudinary upload failed: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            // Return fallback URL
            return '/temp/car_' . $carId . '_' . time() . '_' . rand(1000, 9999) . '.jpg';
        }
    }

    /**
     * Handle image uploads for a car
     *
     * @param Request $request
     * @param Car $car
     * @return array
     */
    private function handleCarImageUpload(Request $request, Car $car)
    {
        $uploadedImages = [];

        if (!$request->hasFile('images')) {
            \Log::info('No images to upload for car', ['car_id' => $car->id]);
            return $uploadedImages;
        }

        \Log::info('Processing images for car', [
            'car_id' => $car->id,
            'image_count' => count($request->file('images'))
        ]);

        foreach ($request->file('images') as $image) {
            // Generate a unique public ID for this image
            $publicId = 'car_' . $car->id . '_' . time() . '_' . rand(1000, 9999);

            // Use our CloudinaryService to upload the image
            $imageUrl = $this->cloudinaryService->uploadImage(
                $image,
                'cars', // folder name
                $publicId // public_id
            );

            // Add the URL to our images array
            $uploadedImages[] = $imageUrl;

            \Log::info('Image processed for car', [
                'car_id' => $car->id,
                'image_url' => $imageUrl,
                'original_name' => $image->getClientOriginalName()
            ]);
        }

        return $uploadedImages;
    }
}
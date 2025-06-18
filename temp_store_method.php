    public function store(Request $request)
    {
        // Debug: Log the incoming request data
        \Log::info('Car store request data:', [
            'all_data' => $request->all(),
            'files' => $request->allFiles(),
            'images_exists' => $request->has('images'),
            'images_is_array' => is_array($request->input('images')),
            'images_value' => $request->input('images'),
            'has_file_images' => $request->hasFile('images'),
            'file_images_count' => $request->hasFile('images') ? count($request->file('images')) : 0,
            'request_keys' => array_keys($request->all()),
            'request_files_keys' => array_keys($request->allFiles()),
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
            // Make images validation more flexible
            'images' => 'sometimes|array|max:10',
            'images.*' => 'sometimes|image|mimes:jpeg,png,jpg,gif|max:5120', // 5MB max per image
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
        $car->auction_status = 'available';
        $car->save();
        
        // Log debug information about image files
        $this->logImageDebugInfo($request);
        
        // Handle car images upload if any
        if ($request->hasFile('images')) {
            $uploadedImages = [];
            \Log::info('Processing car images', ['count' => count($request->file('images'))]);
            
            foreach ($request->file('images') as $image) {
                // Use our new uploadToCloudinary method
                $imageUrl = $this->uploadToCloudinary($image, $car->id);
                $uploadedImages[] = $imageUrl;
                
                \Log::info('Image processed', [
                    'url' => $imageUrl,
                    'original_name' => $image->getClientOriginalName()
                ]);
            }
            
            // Store the image URLs in the car record
            $car->images = $uploadedImages;
            $car->save();
        }
        
        // Log summary information about the car and images
        \Log::info('Car created successfully', [
            'car_id' => $car->id,
            'make' => $car->make,
            'model' => $car->model,
            'images_saved' => isset($uploadedImages) ? count($uploadedImages) : 0,
            'images' => $car->images
        ]);
        
        return response()->json([
            'status' => 'success',
            'message' => 'Car added successfully',
            'data' => $car
        ], 201);
    }

<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Car;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ExhibitorCarController extends Controller
{
    public function store(Request $request)
    {
        try {
            Log::info('=== Exhibitor Car Creation Started ===');
            Log::info('Authenticated Exhibitor ID: ' . auth('exhibitor')->id());

            // التحقق من البيانات
            $validatedData = $request->validate([
                'make' => 'required|string|max:255',
                'model' => 'required|string|max:255',
                'year' => 'required|integer|min:1900|max:' . (date('Y') + 1),
                'vin' => 'required|string|max:17',
                'odometer' => 'required|integer|min:0',
                'color' => 'required|string|max:50',
                'engine_size' => 'nullable|string|max:50',
                'transmission' => 'nullable|string|max:50',
                'description' => 'nullable|string',
                'evaluation_price' => 'required|numeric|min:0',
                'condition' => 'nullable|string|in:new,used,excellent,good,fair,poor',
                'city' => 'nullable|string|max:100',
                'car_type' => 'required|string|max:50',
                'fuel_type' => 'nullable|string|max:50',
                'doors' => 'nullable|string|max:10',
                'features' => 'array',
                'features.*' => 'string|max:100',
                'images' => 'array|max:10',
                'images.*' => 'image|mimes:jpeg,png,jpg|max:5120',
                'auction_start_price' => 'nullable|numeric|min:0',
                'auction_min_price' => 'nullable|numeric|min:0',
                'auction_max_price' => 'nullable|numeric|min:0',
                'auction_start_date' => 'nullable|date',
                'auction_end_date' => 'nullable|date|after:auction_start_date',
            ]);

            // معالجة الصور
            $imagePaths = [];
            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $index => $image) {
                    if ($image && $image->isValid()) {
                        $path = $image->store('cars', 'public');
                        $imagePaths[] = $path;
                        Log::info("Image saved: " . $path);
                    }
                }
            }

            // إنشاء السيارة باستخدام exhibitor_id
            $car = new Car();
            $car->exhibitor_id = auth('exhibitor')->id(); // ✅ استخدام exhibitor_id
            $car->make = $request->make;
            $car->model = $request->model;
            $car->year = $request->year;
            $car->vin = $request->vin;
            $car->odometer = $request->odometer;
            $car->color = $request->color;
            $car->engine_size = $request->engine_size;
            $car->transmission = $request->transmission;
            $car->description = $request->description;
            $car->evaluation_price = $request->evaluation_price;
            $car->condition = $request->condition;
            $car->city = $request->city;
            $car->car_type = $request->car_type;
            $car->fuel_type = $request->fuel_type;
            $car->doors = $request->doors;
            $car->features = $request->features ?? [];
            $car->images = $imagePaths;

            // حقول المزاد
            if ($request->filled('auction_start_price')) {
                $car->auction_start_price = $request->auction_start_price;
            }
            if ($request->filled('auction_min_price')) {
                $car->auction_min_price = $request->auction_min_price;
            }
            if ($request->filled('auction_max_price')) {
                $car->auction_max_price = $request->auction_max_price;
            }
            if ($request->filled('auction_start_date')) {
                $car->auction_start_date = $request->auction_start_date;
            }
            if ($request->filled('auction_end_date')) {
                $car->auction_end_date = $request->auction_end_date;
            }

            $car->save();

            Log::info('Car created successfully', ['car_id' => $car->id]);

            return response()->json([
                'message' => 'تمت إضافة السيارة بنجاح',
                'car' => $car
            ], 201);

        } catch (\Exception $e) {
            Log::error('Car creation error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            return response()->json([
                'message' => 'حدث خطأ في الخادم',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Car;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ShowroomCarController extends Controller
{
    // قائمة كل السيارات في المعرض
    public function index()
    {
        return response()->json(['status' => 'success', 'data' => Car::all()]);
    }

    // إضافة سيارة جديدة للمعرض
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'dealer_id' => 'nullable|integer|exists:dealers,id',
            'user_id' => 'nullable|integer|exists:users,id',
            'make' => 'required|string|max:100',
            'model' => 'required|string|max:100',
            'year' => 'required|integer|min:1900|max:' . (date('Y') + 1),
            'vin' => 'required|string|max:100|unique:cars,vin',
            'odometer' => 'required|integer|min:0',
            'condition' => 'required|string|max:255',
            'evaluation_price' => 'required|numeric|min:0',
            'auction_status' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:255',
            'engine' => 'nullable|string|max:255',
            'transmission' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'images' => 'nullable|array',
            'images.*' => 'nullable|string',
            'plate' => 'nullable|string',
            'min_price' => 'nullable|numeric|min:0',
            'max_price' => 'nullable|numeric|min:0',
            'province' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100'
        ]);
        if ($validator->fails()) {
            return response()->json(['status'=>'error', 'errors'=>$validator->errors()], 422);
        }

        $car = Car::create($request->all());
        return response()->json(['status'=>'success','data'=>$car],201);
    }

    // عرض سيارة واحدة
    public function show($id)
    {
        $car = Car::find($id);
        if(!$car) return response()->json(['status'=>'error','message'=>'Car not found'],404);
        return response()->json(['status'=>'success','data'=>$car]);
    }

    // تحديث بيانات سيارة
    public function update(Request $request, $id)
    {
        $car = Car::find($id);
        if(!$car) return response()->json(['status'=>'error','message'=>'Car not found'],404);

        $validator = Validator::make($request->all(), [
            'dealer_id' => 'nullable|integer|exists:dealers,id',
            'user_id' => 'nullable|integer|exists:users,id',
            'make' => 'sometimes|string|max:100',
            'model' => 'sometimes|string|max:100',
            'year' => 'sometimes|integer|min:1900|max:' . (date('Y') + 1),
            'vin' => 'sometimes|string|max:100|unique:cars,vin,' . $id,
            'odometer' => 'sometimes|integer|min:0',
            'condition' => 'sometimes|string|max:255',
            'evaluation_price' => 'sometimes|numeric|min:0',
            'auction_status' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:255',
            'engine' => 'nullable|string|max:255',
            'transmission' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'images' => 'nullable|array',
            'images.*' => 'nullable|string',
            'plate' => 'nullable|string',
            'min_price' => 'nullable|numeric|min:0',
            'max_price' => 'nullable|numeric|min:0',
            'province' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100'
        ]);
        if ($validator->fails()) {
            return response()->json(['status'=>'error', 'errors'=>$validator->errors()], 422);
        }

        $car->update($request->all());
        return response()->json(['status'=>'success','data'=>$car]);
    }

    // حذف سيارة
    public function destroy($id)
    {
        $car = Car::find($id);
        if(!$car) return response()->json(['status'=>'error','message'=>'Car not found'],404);
        $car->delete();
        return response()->json(['status'=>'success','message'=>'Car deleted']);
    }
}

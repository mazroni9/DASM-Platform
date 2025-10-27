<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Car;
use Illuminate\Support\Facades\Validator;


class CarController extends Controller
{
    /**
     * Admin — all cars (with filters)
     */
    public function index(Request $request)
    {
        $query = Car::with(['dealer.user','auctions','user']);

        if ($request->has('status') && $request['status'] != null) {
            $query->where('auction_status', $request->status);
        }
        if ($request->has('dealer_id') && $request['dealer_id'] != null) {
            $query->where('dealer_id', $request->dealer_id);
        }
        if ($request->has('search') && $request['search'] != null) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('make', 'like', "%{$search}%")
                  ->orWhere('model', 'like', "%{$search}%")
                  ->orWhere('vin', 'like', "%{$search}%");
            });
        }

        $cars = $query->orderBy('created_at', 'desc')
        ->paginate(10);

        return response()->json([
            'status' => 'success',
            'data'   => $cars,
        ]);
    }

        /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        $car = Car::with(['dealer.user', 'auctions'])->findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data'   => $car,
        ]);
    }

    /**
     * Update car status (admin only)
     */
    public function updateCarStatus($id, Request $request)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:available,in_auction,sold',
        ]);
        if ($validator->fails()) {
            return response()->json(['status' => 'error','errors' => $validator->errors()], 422);
        }

        $car = \App\Models\Car::findOrFail($id);
        $car->auction_status = $request->status;

        if ($request->status === 'in_auction') {
            $activeAuction = $car->auctions()->where('status', 'active')->first();
            if (!$activeAuction) {
                $scheduledAuction = $car->auctions()->where('status', 'scheduled')->first();
                if ($scheduledAuction) {
                    $scheduledAuction->status = 'active';
                    $scheduledAuction->control_room_approved = true;
                    $scheduledAuction->save();
                }
            }
        }

        if ($request->status === 'available') {
            $activeAuctions = $car->auctions()->whereIn('status', ['active', 'scheduled'])->get();
            foreach ($activeAuctions as $auction) {
                $auction->status = 'cancelled';
                $auction->save();
            }
        }

        $car->save();

        return response()->json([
            'status'  => 'success',
            'message' => 'Car status updated successfully',
            'data'    => $car
        ]);
    }

    /**
     * Delete car (admin only)
     */
    public function destroy($id)
    {
        $car = \App\Models\Car::findOrFail($id);

        $hasActiveAuctions = $car->auctions()->where('status', 'active')->exists();
        if ($hasActiveAuctions) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Cannot delete car with active auctions. Please cancel the auctions first.'
            ], 400);
        }

        $scheduledAuctions = $car->auctions()->where('status', 'scheduled')->get();
        foreach ($scheduledAuctions as $auction) {
            $auction->status = 'cancelled';
            $auction->save();
        }

        $car->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'Car deleted successfully'
        ]);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        $car = Car::findOrFail($id);

        $rules = [
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
            'description' => 'nullable|string',
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        $car->update($request->all());

        return response()->json([
            'status' => 'success',
            'message' => 'Car updated successfully.',
            'data' => $car
        ]);
    }


}

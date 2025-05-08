<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Caravan;
use App\Models\Dealer;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class CaravanController extends Controller
{
    /**
     * Display a listing of caravans.
     *
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        $query = Caravan::query();
        
        // Apply filters
        if ($request->has('condition')) {
            $query->where('condition', $request->condition);
        }
        
        if ($request->has('location')) {
            $query->where('location', 'LIKE', '%' . $request->location . '%');
        }
        
        if ($request->has('min_price')) {
            $query->where('evaluation_price', '>=', $request->min_price);
        }
        
        if ($request->has('max_price')) {
            $query->where('evaluation_price', '<=', $request->max_price);
        }
        
        if ($request->has('capacity')) {
            $query->where('capacity', '>=', $request->capacity);
        }
        
        if ($request->has('auction_status')) {
            $query->where('auction_status', $request->auction_status);
        }
        
        // Order results
        $query->orderBy($request->get('order_by', 'created_at'), $request->get('order', 'desc'));
        
        // Paginate results
        $caravans = $query->paginate($request->get('per_page', 10));
        
        return response()->json($caravans);
    }

    /**
     * Store a newly created caravan.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        // Validate request
        $validator = Validator::make($request->all(), [
            'make' => 'required|string|max:100',
            'model' => 'required|string|max:100',
            'year' => 'required|integer|min:1900|max:2099',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'full_description' => 'nullable|string',
            'length' => 'required|numeric|min:0',
            'width' => 'required|numeric|min:0',
            'height' => 'required|numeric|min:0',
            'weight' => 'required|numeric|min:0',
            'engine' => 'nullable|string|max:100',
            'fuel' => 'nullable|string|max:50',
            'transmission' => 'nullable|string|max:50',
            'drive' => 'nullable|string|max:50',
            'mileage' => 'nullable|integer|min:0',
            'capacity' => 'required|integer|min:1|max:20',
            'features' => 'required|array',
            'images' => 'required|array',
            'location' => 'required|string|max:100',
            'condition' => 'required|in:new,excellent,good,fair,poor',
            'evaluation_price' => 'required|numeric|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Get authenticated user
        $user = Auth::user();
        
        // Check if user is a dealer
        $dealerId = null;
        if ($user->role === 'seller' && $user->dealer) {
            $dealerId = $user->dealer->id;
        } else {
            return response()->json(['error' => 'Only dealers can register caravans'], 403);
        }

        // Create new caravan
        $caravan = Caravan::create(array_merge(
            $request->all(),
            ['dealer_id' => $dealerId]
        ));

        return response()->json([
            'message' => 'Caravan registered successfully',
            'caravan' => $caravan
        ], 201);
    }

    /**
     * Display the specified caravan.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $caravan = Caravan::with(['dealer', 'dealer.user'])->findOrFail($id);
        
        return response()->json($caravan);
    }

    /**
     * Update the specified caravan.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        // Find caravan
        $caravan = Caravan::findOrFail($id);
        
        // Check if user is authorized to update this caravan
        $user = Auth::user();
        if (($user->role === 'seller' && $user->dealer && $user->dealer->id === $caravan->dealer_id) || 
            $user->role === 'admin') {
            // User is authorized
        } else {
            return response()->json(['error' => 'You are not authorized to update this caravan'], 403);
        }
        
        // Validate request
        $validator = Validator::make($request->all(), [
            'make' => 'sometimes|string|max:100',
            'model' => 'sometimes|string|max:100',
            'year' => 'sometimes|integer|min:1900|max:2099',
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'full_description' => 'nullable|string',
            'length' => 'sometimes|numeric|min:0',
            'width' => 'sometimes|numeric|min:0',
            'height' => 'sometimes|numeric|min:0',
            'weight' => 'sometimes|numeric|min:0',
            'engine' => 'nullable|string|max:100',
            'fuel' => 'nullable|string|max:50',
            'transmission' => 'nullable|string|max:50',
            'drive' => 'nullable|string|max:50',
            'mileage' => 'nullable|integer|min:0',
            'capacity' => 'sometimes|integer|min:1|max:20',
            'features' => 'sometimes|array',
            'images' => 'sometimes|array',
            'location' => 'sometimes|string|max:100',
            'condition' => 'sometimes|in:new,excellent,good,fair,poor',
            'evaluation_price' => 'sometimes|numeric|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        // Update caravan
        $caravan->update($request->all());
        
        return response()->json([
            'message' => 'Caravan updated successfully',
            'caravan' => $caravan
        ]);
    }

    /**
     * Remove the specified caravan.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        // Find caravan
        $caravan = Caravan::findOrFail($id);
        
        // Check if user is authorized to delete this caravan
        $user = Auth::user();
        if (($user->role === 'seller' && $user->dealer && $user->dealer->id === $caravan->dealer_id) || 
            $user->role === 'admin') {
            // User is authorized
        } else {
            return response()->json(['error' => 'You are not authorized to delete this caravan'], 403);
        }
        
        // Check if caravan can be deleted (not in active auction)
        if ($caravan->auction_status === 'live' || $caravan->auction_status === 'sold') {
            return response()->json(['error' => 'Cannot delete a caravan that is in active auction or sold'], 400);
        }
        
        $caravan->delete();
        
        return response()->json(['message' => 'Caravan deleted successfully']);
    }
    
    /**
     * Submit a caravan for auction.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function submitForAuction(Request $request, $id)
    {
        // Find caravan
        $caravan = Caravan::findOrFail($id);
        
        // Check if user is authorized to submit this caravan for auction
        $user = Auth::user();
        if (($user->role === 'seller' && $user->dealer && $user->dealer->id === $caravan->dealer_id) || 
            $user->role === 'admin') {
            // User is authorized
        } else {
            return response()->json(['error' => 'You are not authorized to submit this caravan for auction'], 403);
        }
        
        // Check if caravan can be submitted (not already in auction)
        if ($caravan->auction_status !== 'pending') {
            return response()->json(['error' => 'Caravan is already in auction or sold'], 400);
        }
        
        // Validate request
        $validator = Validator::make($request->all(), [
            'starting_bid' => 'required|numeric|min:0',
            'auction_start' => 'required|date|after:now',
            'auction_end' => 'required|date|after:auction_start'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        // Create auction
        $auction = $caravan->auctions()->create([
            'start_time' => $request->auction_start,
            'end_time' => $request->auction_end,
            'starting_bid' => $request->starting_bid,
            'status' => 'scheduled',
            'auctionable_type' => 'App\\Models\\Caravan',
            'auctionable_id' => $caravan->id
        ]);
        
        // Update caravan status
        $caravan->auction_status = 'scheduled';
        $caravan->save();
        
        return response()->json([
            'message' => 'Caravan submitted for auction successfully',
            'auction' => $auction
        ]);
    }
} 
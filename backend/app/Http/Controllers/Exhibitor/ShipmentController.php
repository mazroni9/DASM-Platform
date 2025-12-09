<?php

namespace App\Http\Controllers\Exhibitor;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreShipmentRequest;
use App\Http\Requests\UpdateShipmentStatusRequest;
use App\Http\Resources\ShipmentResource;
use App\Models\Shipment;
use App\Models\VenueOwner;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class ShipmentController extends Controller
{
    // GET /api/exhibitor/shipments
    public function index(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'status'        => ['nullable','integer','min:0','max:3'],
            'q'             => ['nullable','string','max:120'],
            'per_page'      => ['nullable','integer','min:1','max:50'],
            'from'          => ['nullable','date'],
            'to'            => ['nullable','date'],
            // متاحة للأدمن/المشرف فقط كفلاتر
            'venue_owner_id'=> ['nullable','integer','exists:venue_owners,id'],
            'buyer_id'      => ['nullable','integer','exists:users,id'],
        ]);

        $perPage = $validated['per_page'] ?? 10;
        $role = is_string($user->type) ? $user->type : ($user->type?->value ?? null);

        $q = Shipment::query()->with('items');

        if ($role === UserRole::VENUE_OWNER->value) {
            $owner = VenueOwner::where('user_id', $user->id)->firstOrFail();
            $q->where('venue_owner_id', $owner->id);
        } elseif (in_array($role, [UserRole::ADMIN->value, UserRole::MODERATOR->value], true)) {
            if (!empty($validated['venue_owner_id'])) $q->where('venue_owner_id', $validated['venue_owner_id']);
            if (!empty($validated['buyer_id']))       $q->where('buyer_id', $validated['buyer_id']);
        } else {
            $q->where('buyer_id', $user->id);
        }

        if (isset($validated['status'])) {
            $q->where('shipping_status', $validated['status']);
        }
        if (!empty($validated['q'])) {
            $s = $validated['q'];
            $q->where(function ($w) use ($s) {
                $w->where('recipient_name', 'like', "%{$s}%")
                  ->orWhere('address_line', 'like', "%{$s}%")
                  ->orWhere('tracking_number', 'like', "%{$s}%");
            });
        }
        if (!empty($validated['from'])) $q->whereDate('created_at', '>=', $validated['from']);
        if (!empty($validated['to']))   $q->whereDate('created_at', '<=', $validated['to']);

        $q->latest('created_at');

        return ShipmentResource::collection(
            $q->paginate($perPage)->appends($request->query())
        );
    }

    // GET /api/exhibitor/shipments/{shipment}
    public function show(Request $request, Shipment $shipment)
    {
        Gate::authorize('view', $shipment);
        $shipment->load('items');
        return new ShipmentResource($shipment);
    }

    // POST /api/exhibitor/shipments
    public function store(StoreShipmentRequest $request)
    {
        $user = $request->user();
        $role = is_string($user->type) ? $user->type : ($user->type?->value ?? null);

        Gate::authorize('create', Shipment::class);

        $data = $request->validated();

        // تحديد venue_owner_id:
        if ($role === UserRole::VENUE_OWNER->value) {
            $owner = VenueOwner::where('user_id', $user->id)->firstOrFail();
            $venueOwnerId = $owner->id;
        } elseif (in_array($role, [UserRole::ADMIN->value, UserRole::MODERATOR->value], true)) {
            $venueOwnerId = $data['venue_owner_id'] ?? null;
            if (!$venueOwnerId) {
                return response()->json(['message' => 'يرجى تمرير venue_owner_id'], 422);
            }
        } else {
            return response()->json(['message' => 'غير مصرح بإنشاء شحنة'], 403);
        }

        return DB::transaction(function () use ($data, $venueOwnerId) {
            $shipment = Shipment::create([
                'venue_owner_id'  => $venueOwnerId,
                'buyer_id'        => $data['buyer_id'],

                'recipient_name'  => $data['recipient_name'],
                'address_line'    => $data['address'],
                'city'            => $data['city'] ?? null,
                'region'          => $data['region'] ?? null,
                'country'         => $data['country'] ?? null,
                'postal_code'     => $data['postal_code'] ?? null,

                'carrier_code'    => $data['carrier_code'] ?? null,
                'tracking_number' => $data['tracking_number'] ?? null,
                'shipping_status' => $data['shipping_status'] ?? 0,
                'payment_status'  => $data['payment_status'] ?? 'محجوز',
            ]);

            foreach ($data['items'] as $it) {
                $shipment->items()->create([
                    'name' => $it['name'],
                    'qty'  => $it['qty'] ?? 1,
                ]);
            }

            $shipment->recomputeItemsAggregates();

            return (new ShipmentResource($shipment->load('items')))
                ->response()->setStatusCode(201);
        });
    }

    // PATCH /api/exhibitor/shipments/{shipment}/status
    public function updateStatus(UpdateShipmentStatusRequest $request, Shipment $shipment)
    {
        Gate::authorize('update', $shipment);
        $data = $request->validated();

        if (array_key_exists('shipping_status', $data)) $shipment->shipping_status = $data['shipping_status'];
        if (array_key_exists('tracking_number', $data)) $shipment->tracking_number = $data['tracking_number'];
        if (array_key_exists('carrier_code', $data))    $shipment->carrier_code    = $data['carrier_code'];
        if (array_key_exists('payment_status', $data))  $shipment->payment_status  = $data['payment_status'];
        if (array_key_exists('delivered_at', $data))    $shipment->delivered_at    = $data['delivered_at'];

        if (($shipment->shipping_status ?? null) === 3 && !$shipment->delivered_at) {
            $shipment->delivered_at = now();
        }

        $shipment->save();

        return new ShipmentResource($shipment->load('items'));
    }

    // DELETE /api/exhibitor/shipments/{shipment}
    public function destroy(Request $request, Shipment $shipment)
    {
        Gate::authorize('delete', $shipment);
        $shipment->delete();
        return response()->json(['status' => 'ok']);
    }
}

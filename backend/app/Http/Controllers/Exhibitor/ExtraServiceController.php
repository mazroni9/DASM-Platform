<?php

namespace App\Http\Controllers\Exhibitor;

use App\Http\Controllers\Controller;
use App\Models\ExtraService;
use App\Models\ServiceRequest;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ExtraServiceController extends Controller
{
    // GET /api/exhibitor/extra-services
    public function services(Request $request)
    {
        $list = ExtraService::active()
            ->orderBy('name')
            ->get(['id','name','description','details','icon','base_price','currency','is_active']);

        return response()->json(['success' => true, 'data' => $list]);
    }

    // GET /api/exhibitor/extra-services/requests
    public function index(Request $request)
    {
        $user = $request->user();
        $venueOwnerId = $user?->venueOwner?->id;

        if (!$venueOwnerId) {
            return response()->json(['success' => false, 'message' => 'ليس لديك ملف معرض.'], 403);
        }

        $perPage = (int)($request->integer('per_page') ?: 10);
        $status  = $request->get('status');
        $q       = $request->get('q');
        $from    = $request->get('from');
        $to      = $request->get('to');

        $query = ServiceRequest::with(['service'])
            ->where('venue_owner_id', $venueOwnerId)
            ->orderByDesc('requested_at');

        if ($status && in_array($status, ServiceRequest::allowedStatuses(), true)) {
            $query->where('status', $status);
        }

        if ($q) {
            $query->where(function ($sub) use ($q) {
                $sub->where('car', 'like', "%{$q}%")
                    ->orWhere('notes', 'like', "%{$q}%")
                    ->orWhereHas('service', function ($s) use ($q) {
                        $s->where('name', 'like', "%{$q}%");
                    });
            });
        }

        if ($from) $query->whereDate('requested_at', '>=', $from);
        if ($to)   $query->whereDate('requested_at', '<=', $to);

        return response()->json($query->paginate($perPage));
    }

    // POST /api/exhibitor/extra-services/requests
    public function store(Request $request)
    {
        $user = $request->user();
        $venueOwner = $user?->venueOwner;

        if (!$venueOwner) {
            return response()->json(['success' => false, 'message' => 'ليس لديك ملف معرض.'], 403);
        }

        $data = $request->validate([
            'service_id' => ['required', 'exists:extra_services,id'],
            'car'        => ['nullable', 'string', 'max:255'],
            'notes'      => ['nullable', 'string', 'max:5000'],
            'price'      => ['nullable', 'numeric', 'min:0'],
            'currency'   => ['nullable', 'string', 'max:8'],
        ]);

        $service = ExtraService::active()->findOrFail($data['service_id']);

        $price    = array_key_exists('price', $data) ? $data['price'] : $service->base_price;
        $currency = $data['currency'] ?? $service->currency ?? 'SAR';

        $sr = ServiceRequest::create([
            'venue_owner_id'   => $venueOwner->id,
            'user_id'          => $user->id,
            'extra_service_id' => $service->id,
            'car'              => $data['car'] ?? null,
            'notes'            => $data['notes'] ?? null,
            'price'            => $price,
            'currency'         => $currency,
            'status'           => ServiceRequest::STATUS_PENDING,
            'requested_at'     => now(),
        ]);

        return response()->json(['success' => true, 'data' => $sr->load('service'), 'message' => 'تم إنشاء طلب الخدمة.'], 201);
    }

    // GET /api/exhibitor/extra-services/requests/{requestModel}
    public function show(ServiceRequest $requestModel, Request $request)
    {
        $user = $request->user();
        if ($requestModel->venue_owner_id !== ($user?->venueOwner?->id)) {
            return response()->json(['success' => false, 'message' => 'غير مسموح.'], 403);
        }
        return response()->json(['success' => true, 'data' => $requestModel->load('service')]);
    }

    // PATCH /api/exhibitor/extra-services/requests/{requestModel}/status
    public function updateStatus(ServiceRequest $requestModel, Request $request)
    {
        $user = $request->user();
        if ($requestModel->venue_owner_id !== ($user?->venueOwner?->id)) {
            return response()->json(['success' => false, 'message' => 'غير مسموح.'], 403);
        }

        $data = $request->validate([
            'status' => ['required', Rule::in([ServiceRequest::STATUS_CANCELED])],
        ]);

        if ($requestModel->status === ServiceRequest::STATUS_COMPLETED) {
            return response()->json(['success' => false, 'message' => 'لا يمكن إلغاء طلب مكتمل.'], 422);
        }

        $requestModel->status = $data['status'];
        $requestModel->save();

        return response()->json(['success' => true, 'data' => $requestModel->load('service'), 'message' => 'تم تحديث الحالة.']);
    }

    // DELETE /api/exhibitor/extra-services/requests/{requestModel}
    public function destroy(ServiceRequest $requestModel, Request $request)
    {
        $user = $request->user();
        if ($requestModel->venue_owner_id !== ($user?->venueOwner?->id)) {
            return response()->json(['success' => false, 'message' => 'غير مسموح.'], 403);
        }

        if (!in_array($requestModel->status, [ServiceRequest::STATUS_PENDING, ServiceRequest::STATUS_CANCELED], true)) {
            return response()->json(['success' => false, 'message' => 'لا يمكن حذف هذا الطلب بالحالة الحالية.'], 422);
        }

        $requestModel->delete();
        return response()->json(['success' => true, 'message' => 'تم حذف الطلب.']);
    }
}

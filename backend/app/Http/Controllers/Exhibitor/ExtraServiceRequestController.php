<?php

namespace App\Http\Controllers\Exhibitor;

use App\Http\Controllers\Controller;
use App\Models\ExtraService;
use App\Models\ServiceRequest; // ✅ نستخدم الموديل الموجود عندك
use Illuminate\Http\Request;

class ExtraServiceRequestController extends Controller
{
    /**
     * قائمة طلبات المستخدم (paginate)
     */
    public function index(Request $request)
    {
        $perPage = (int) $request->integer('per_page', 10);
        $status  = trim((string) $request->query('status', ''));

        $query = ServiceRequest::query()
            ->with(['service:id,name,icon,base_price,currency'])
            ->where('user_id', $request->user()->id)
            ->orderByDesc('id');

        if ($status !== '') {
            $query->where('status', $status);
        }

        $paginator = $query->paginate($perPage);

        // نرجّع شكل paginator القياسي
        return response()->json($paginator);
    }

    /**
     * إنشاء طلب خدمة جديد
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'service_id'     => ['required','integer','exists:extra_services,id'],
            'car_id'         => ['nullable','integer','exists:cars,id'],
            'notes'          => ['nullable','string','max:2000'],
            'preferred_date' => ['nullable','date'],
            'quantity'       => ['nullable','integer','min:1'],
        ]);

        $service = ExtraService::query()
            ->where('id', $validated['service_id'])
            ->firstOrFail();

        if (!$service->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'هذه الخدمة غير مفعّلة حاليًا.',
            ], 422);
        }

        $qty = max(1, (int) ($validated['quantity'] ?? 1));

        // حساب السعر الكلي بدقّة مع تقريب لمرتين عشريًا
        $total = number_format((float) $service->base_price * $qty, 2, '.', '');

        $req = ServiceRequest::create([
            'user_id'        => $request->user()->id,
            'service_id'     => $service->id,                // ✅ عمود FK المتوقّع في جدولك
            'car_id'         => $validated['car_id'] ?? null,
            'notes'          => $validated['notes'] ?? null,
            'preferred_date' => $validated['preferred_date'] ?? null,
            'quantity'       => $qty,
            'status'         => 'pending',                   // ✅ بدون الاعتماد على ثابت غير موجود
            'total_price'    => $total,
            'currency'       => $service->currency ?? 'SAR',
        ]);

        $req->load('service:id,name,icon,base_price,currency');

        return response()->json([
            'success' => true,
            'data'    => $req,
        ], 201);
    }

    /**
     * عرض طلب واحد للمستخدم الحالي
     */
    public function show(Request $request, int $id)
    {
        $req = ServiceRequest::with('service:id,name,icon,base_price,currency')
            ->where('user_id', $request->user()->id)
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $req,
        ]);
    }
}

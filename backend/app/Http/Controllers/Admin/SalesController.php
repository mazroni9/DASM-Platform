<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Settlement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SalesController extends Controller
{
    /**
     * Display a listing of sales (settlements).
     * Supports filters: status, gateway, date_from, date_to
     * Supports CSV export via ?export=csv
     *
     * @return \Illuminate\Http\JsonResponse|StreamedResponse
     */
    public function index(Request $request)
    {
        // AdminMiddleware already ensures user is admin/moderator

        $query = Settlement::with(['auction', 'buyer', 'seller', 'car'])
            ->select([
                'id',
                'auction_id',
                'seller_id',
                'buyer_id',
                'car_id',
                'final_price',
                'car_price',
                'platform_fee',
                'platform_commission',
                'service_fees_total',
                'service_fees_payment_status',
                'service_fees_payment_ref',
                'service_fees_gateway',
                'vehicle_price_total',
                'escrow_payment_status',
                'escrow_release_status',
                'seller_type',
                'partner_incentive',
                'verification_code',
                'status',
                'created_at',
            ])
            ->orderByDesc('created_at');

        // Filter by service fees payment status
        if ($request->filled('fees_status')) {
            $query->where('service_fees_payment_status', strtoupper($request->fees_status));
        }

        // Filter by escrow payment status
        if ($request->filled('escrow_status')) {
            $query->where('escrow_payment_status', strtoupper($request->escrow_status));
        }

        // Filter by payment gateway
        if ($request->filled('gateway')) {
            $query->where('service_fees_gateway', strtoupper($request->gateway));
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // CSV Export
        if ($request->query('export') === 'csv') {
            $settlements = $query->get();
            return $this->exportToCsv($settlements);
        }

        // Paginated response
        $settlements = $query->paginate(15);

        // Calculate stats
        $stats = $this->calculateStats();

        // Transform data to include calculated fields
        $settlements->getCollection()->transform(function ($settlement) {
            return $this->transformSettlement($settlement);
        });

        return response()->json([
            'status' => 'success',
            'data' => [
                'settlements' => $settlements,
                'stats' => $stats,
            ],
        ]);
    }

    /**
     * Display a single sale (settlement) with full details.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        // AdminMiddleware already ensures user is admin/moderator

        $settlement = Settlement::with(['auction', 'buyer', 'seller', 'car'])
            ->find($id);

        if (!$settlement) {
            return response()->json([
                'status' => 'error',
                'message' => 'Settlement not found',
            ], 404);
        }

        $data = $this->transformSettlement($settlement, true);

        // Add detailed financial breakdown
        $data['financial_breakdown'] = $this->calculateFinancialBreakdown($settlement);

        // Add seller settlement calculation
        $data['seller_settlement'] = $this->calculateSellerSettlement($settlement);

        return response()->json([
            'status' => 'success',
            'data' => $data,
        ]);
    }

    /**
     * Release funds to seller (update escrow_release_status).
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function releaseFunds($id)
    {
        // AdminMiddleware already ensures user is admin/moderator

        $settlement = Settlement::find($id);

        if (!$settlement) {
            return response()->json([
                'status' => 'error',
                'message' => 'Settlement not found',
            ], 404);
        }

        // Only allow release if escrow is verified/paid
        if (!in_array($settlement->escrow_payment_status, ['PAID', 'VERIFIED', 'PENDING'])) {
            return response()->json([
                'status' => 'error',
                'message' => 'Cannot release funds: escrow payment not verified',
            ], 400);
        }

        $settlement->escrow_release_status = 'RELEASED';
        $settlement->save();

        Log::info("Funds released for settlement #{$id} by admin " . optional(auth()->user())->id);

        return response()->json([
            'status' => 'success',
            'message' => 'Funds released to seller successfully',
            'data' => $this->transformSettlement($settlement->fresh(['auction', 'buyer', 'seller', 'car'])),
        ]);
    }

    /**
     * Initiate refund to buyer.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function refundBuyer($id)
    {
        // AdminMiddleware already ensures user is admin/moderator

        $settlement = Settlement::find($id);

        if (!$settlement) {
            return response()->json([
                'status' => 'error',
                'message' => 'Settlement not found',
            ], 404);
        }

        // Mark for refund (actual refund logic would be handled by payment service)
        $settlement->status = 'refund_pending';
        $settlement->save();

        Log::info("Refund initiated for settlement #{$id} by admin " . optional(auth()->user())->id);

        return response()->json([
            'status' => 'success',
            'message' => 'Refund initiated for buyer',
            'data' => $this->transformSettlement($settlement->fresh(['auction', 'buyer', 'seller', 'car'])),
        ]);
    }

    /**
     * Manually verify offline bank transfer.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function verifyBankTransfer($id)
    {
        // AdminMiddleware already ensures user is admin/moderator

        $settlement = Settlement::find($id);

        if (!$settlement) {
            return response()->json([
                'status' => 'error',
                'message' => 'Settlement not found',
            ], 404);
        }

        $settlement->escrow_payment_status = 'VERIFIED';
        $settlement->save();

        Log::info("Bank transfer verified for settlement #{$id} by admin " . optional(auth()->user())->id);

        return response()->json([
            'status' => 'success',
            'message' => 'Bank transfer verified successfully',
            'data' => $this->transformSettlement($settlement->fresh(['auction', 'buyer', 'seller', 'car'])),
        ]);
    }

    /**
     * Transform settlement for API response.
     */
    private function transformSettlement(Settlement $settlement, bool $detailed = false): array
    {
        $vatRate = 0.15;
        $commission = $settlement->platform_commission ?? $settlement->platform_fee ?? 0;
        $commissionVat = round($commission * $vatRate, 2);
        $partnerIncentive = $settlement->partner_incentive ?? 0;
        $netProfit = round($commission + $commissionVat - $partnerIncentive, 2);

        $data = [
            'id' => $settlement->id,
            'auction_id' => $settlement->auction_id,
            'verification_code' => $settlement->verification_code,
            'status' => $settlement->status,
            'created_at' => $settlement->created_at,

            // Car info
            'car' => $settlement->car ? [
                'id' => $settlement->car->id,
                'make' => $settlement->car->make ?? null,
                'model' => $settlement->car->model ?? null,
                'year' => $settlement->car->year ?? null,
                'image' => $settlement->car->images[0] ?? $settlement->car->main_image ?? null,
                'title' => $this->getCarTitle($settlement->car),
            ] : null,

            // Auction info
            'auction' => $settlement->auction ? [
                'id' => $settlement->auction->id,
                'ref' => 'AUC-' . str_pad($settlement->auction->id, 6, '0', STR_PAD_LEFT),
                'type' => $settlement->auction->auction_type ?? null,
            ] : null,

            // Parties
            'seller' => $settlement->seller ? [
                'id' => $settlement->seller->id,
                'name' => trim(($settlement->seller->first_name ?? '') . ' ' . ($settlement->seller->last_name ?? '')),
                'type' => $settlement->seller_type,
            ] : null,
            'buyer' => $settlement->buyer ? [
                'id' => $settlement->buyer->id,
                'name' => trim(($settlement->buyer->first_name ?? '') . ' ' . ($settlement->buyer->last_name ?? '')),
            ] : null,

            // Financials
            'car_price' => (float) ($settlement->car_price ?? $settlement->final_price ?? 0),
            'platform_commission' => (float) $commission,
            'commission_vat' => $commissionVat,
            'partner_incentive' => (float) $partnerIncentive,
            'net_profit' => $netProfit,
            'service_fees_total' => (float) ($settlement->service_fees_total ?? 0),

            // Phase 1: Service Fees Payment
            'phase1' => [
                'status' => $settlement->service_fees_payment_status ?? 'PENDING',
                'gateway' => $settlement->service_fees_gateway ?? null,
                'transaction_ref' => $settlement->service_fees_payment_ref ?? null,
            ],

            // Phase 2: Vehicle Price / Escrow
            'phase2' => [
                'status' => $settlement->escrow_payment_status ?? 'PENDING',
                'release_status' => $settlement->escrow_release_status ?? 'NOT_APPLICABLE',
                'amount' => (float) ($settlement->vehicle_price_total ?? $settlement->car_price ?? 0),
            ],
        ];

        return $data;
    }

    /**
     * Calculate financial breakdown for detail view.
     */
    private function calculateFinancialBreakdown(Settlement $settlement): array
    {
        $vatRate = 0.15;
        $commission = $settlement->platform_commission ?? $settlement->platform_fee ?? 0;
        $commissionVat = round($commission * $vatRate, 2);

        return [
            'phase1' => [
                'label' => 'رسوم الخدمة (دفع إلكتروني)',
                'gateway' => $settlement->service_fees_gateway,
                'transaction_id' => $settlement->service_fees_payment_ref,
                'status' => $settlement->service_fees_payment_status,
                'breakdown' => [
                    ['label' => 'عمولة المنصة', 'amount' => (float) $commission],
                    ['label' => 'ضريبة القيمة المضافة (15%)', 'amount' => $commissionVat],
                    ['label' => 'رسوم TAM', 'amount' => (float) ($settlement->tam_fee ?? 0)],
                    ['label' => 'رسوم المرور', 'amount' => (float) ($settlement->muroor_fee ?? 0)],
                ],
                'total' => (float) ($settlement->service_fees_total ?? 0),
            ],
            'phase2' => [
                'label' => 'دفع قيمة المركبة (ضمان)',
                'method' => 'BANK_TRANSFER', // Could be SADAD/SARIE
                'reference_code' => $settlement->verification_code,
                'status' => $settlement->escrow_payment_status,
                'amount' => (float) ($settlement->vehicle_price_total ?? $settlement->car_price ?? 0),
                'release_status' => $settlement->escrow_release_status,
            ],
        ];
    }

    /**
     * Calculate seller settlement (net payout).
     */
    private function calculateSellerSettlement(Settlement $settlement): array
    {
        $vatRate = 0.15;
        $carPrice = $settlement->car_price ?? $settlement->final_price ?? 0;
        $commission = $settlement->platform_commission ?? $settlement->platform_fee ?? 0;
        $commissionVat = round($commission * $vatRate, 2);
        $deduction = $settlement->seller_commission_deduction ?? 0;

        // For partners, commission might be 0
        $isPartner = $settlement->seller_type === 'partner';
        $totalDeductions = $isPartner ? 0 : ($commission + $commissionVat + $deduction);
        $netPayout = $carPrice - $totalDeductions;

        return [
            'is_partner' => $isPartner,
            'car_price' => (float) $carPrice,
            'deductions' => [
                ['label' => 'عمولة المنصة', 'amount' => (float) ($isPartner ? 0 : $commission)],
                ['label' => 'ضريبة القيمة المضافة', 'amount' => $isPartner ? 0 : $commissionVat],
                ['label' => 'خصومات إضافية', 'amount' => (float) $deduction],
            ],
            'total_deductions' => $totalDeductions,
            'net_payout' => $netPayout,
            'payout_status' => $settlement->escrow_release_status === 'RELEASED' ? 'SENT' : 'PENDING',
        ];
    }

    /**
     * Calculate stats for the index page.
     */
    private function calculateStats(): array
    {
        return [
            'total_sales' => Settlement::count(),
            'total_commission' => Settlement::sum(DB::raw('COALESCE(platform_commission, platform_fee, 0)')),
            'pending_escrow' => Settlement::where('escrow_payment_status', 'PENDING')->count(),
            'released_funds' => Settlement::where('escrow_release_status', 'RELEASED')->count(),
            'total_volume' => Settlement::sum(DB::raw('COALESCE(car_price, final_price, 0)')),
        ];
    }

    /**
     * Get car title string.
     */
    private function getCarTitle($car): string
    {
        if (!$car) return 'Unknown';
        return trim(($car->make ?? '') . ' ' . ($car->model ?? '') . ' ' . ($car->year ?? ''));
    }

    /**
     * Export settlements to CSV.
     */
    private function exportToCsv($settlements): StreamedResponse
    {
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="sales_export_' . date('Y-m-d_His') . '.csv"',
        ];

        $callback = function () use ($settlements) {
            $file = fopen('php://output', 'w');

            // Add BOM for Excel UTF-8 compatibility
            fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));

            // Header row
            fputcsv($file, [
                'ID',
                'Auction Ref',
                'Verification Code',
                'Car',
                'Seller',
                'Buyer',
                'Car Price (SAR)',
                'Commission (SAR)',
                'Service Fees (SAR)',
                'Fees Status',
                'Gateway',
                'Escrow Status',
                'Release Status',
                'Date',
            ]);

            // Data rows
            foreach ($settlements as $s) {
                $transformed = $this->transformSettlement($s);
                fputcsv($file, [
                    $s->id,
                    $transformed['auction']['ref'] ?? '',
                    $s->verification_code ?? '',
                    $transformed['car']['title'] ?? '',
                    $transformed['seller']['name'] ?? '',
                    $transformed['buyer']['name'] ?? '',
                    $transformed['car_price'],
                    $transformed['platform_commission'],
                    $transformed['service_fees_total'],
                    $transformed['phase1']['status'],
                    $transformed['phase1']['gateway'],
                    $transformed['phase2']['status'],
                    $transformed['phase2']['release_status'],
                    $s->created_at,
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}

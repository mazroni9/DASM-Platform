<?php

namespace App\Http\Controllers\Exhibitor;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreVenueOwnerReviewRequest;
use App\Http\Requests\UpdateVenueOwnerReviewRequest;
use App\Models\VenueOwner;
use App\Models\VenueOwnerReview;
use Illuminate\Http\Request;

class VenueOwnerRatingController extends Controller
{
    /**
     * رجّع ملخّص التقييمات + القائمة (للمعرض الحالي المُسجّل).
     * GET /api/exhibitor/ratings
     */
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        $venue = VenueOwner::where('user_id', $userId)->firstOrFail();

        // فلترة بسيطة
        $perPage = (int) $request->get('per_page', 10);
        $reviews = $venue->reviews()
            ->with(['user:id,name'])
            ->where('is_approved', true)
            ->latest()
            ->paginate($perPage);

        $summary = $this->buildSummary($venue);

        // شكل يناسب الواجهه الأمامية
        $mapped = $reviews->getCollection()->map(function (VenueOwnerReview $r) {
            return [
                'name'    => $r->user?->name ?? 'مستخدم',
                'comment' => $r->comment,
                'rating'  => (float) $r->rating,
                'created_at' => $r->created_at?->toIso8601String(),
            ];
        });

        $reviews->setCollection($mapped);

        return response()->json([
            'success' => true,
            'data' => [
                'platform_rating' => $summary['platform'],
                'customer_rating' => $summary['customer'],
                'overall'         => $summary['overall'],
                'counts'          => $summary['counts'], // توزيع النجوم
                'reviews'         => $reviews,
            ],
        ]);
    }

    /**
     * POST /api/exhibitor/ratings
     * ملاحظة: هذه للنشر “كعميل” — إن لم ترد السماح لصاحب المعرض بنشر مراجعة لنفسه فاقفلها بسياسة.
     */
    public function store(StoreVenueOwnerReviewRequest $request)
    {
        $user = $request->user();
        $venue = VenueOwner::findOrFail($request->venue_owner_id);

        // لا تقيّم نفسك
        if ($venue->user_id === $user->id) {
            return response()->json(['message' => 'لا يمكنك تقييم معرضك!'], 422);
        }

        // منع التكرار (محمي أيضاً ب UNIQUE)
        $exists = VenueOwnerReview::where('venue_owner_id', $venue->id)
            ->where('user_id', $user->id)->exists();
        if ($exists) {
            return response()->json(['message' => 'لقد قيّمت هذا المعرض مسبقاً.'], 422);
        }

        $review = VenueOwnerReview::create([
            'venue_owner_id' => $venue->id,
            'user_id'        => $user->id,
            'rating'         => $request->rating,
            'comment'        => $request->comment,
            'verified'       => (bool) $request->boolean('verified', false),
            'is_approved'    => true, // أو اجعلها false وتعمل اعتماد من لوحة الإدارة
        ]);

        // حدّث المتوسط المخزَّن
        $venue->recalcRating();

        return response()->json([
            'success' => true,
            'data' => $review,
            'message' => 'تم إضافة المراجعة.',
        ], 201);
    }

    /**
     * تعديل مراجعة يملكها نفس المستخدم
     * PUT /api/exhibitor/ratings/{review}
     */
    public function update(UpdateVenueOwnerReviewRequest $request, VenueOwnerReview $review)
    {
        // السماح فقط لصاحب التعليق أو أدمن — هنا ببساطة:
        if ($review->user_id !== $request->user()->id) {
            return response()->json(['message' => 'غير مصرح'], 403);
        }

        $review->fill($request->only(['rating','comment','verified']))->save();

        // حدّث المتوسط
        $review->venueOwner->recalcRating();

        return response()->json(['success' => true, 'data' => $review]);
    }

    /**
     * حذف مراجعة
     * DELETE /api/exhibitor/ratings/{review}
     */
    public function destroy(Request $request, VenueOwnerReview $review)
    {
        if ($review->user_id !== $request->user()->id && $request->user()->cannot('delete', $review)) {
            // أو استبدل بسياستك… هنا تفويض بدائي
            return response()->json(['message' => 'غير مصرح'], 403);
        }

        $venue = $review->venueOwner;
        $review->delete();
        $venue->recalcRating();

        return response()->json(['success' => true, 'message' => 'تم الحذف.']);
    }

    /**
     * GET /api/exhibitor/ratings/summary
     * ملخّص فقط بدون قائمة
     */
    public function summary(Request $request)
    {
        $venue = VenueOwner::where('user_id', $request->user()->id)->firstOrFail();
        return response()->json([
            'success' => true,
            'data' => $this->buildSummary($venue),
        ]);
    }

    /**
     * ملخّص التقييمات: platform/customer/overall + counts لتوزيع النجوم
     */
    private function buildSummary(VenueOwner $venue): array
    {
        $approved = $venue->reviews()->where('is_approved', true);

        $customer = (float) number_format((float) $approved->avg('rating') ?: 0, 2, '.', '');
        $platform = (float) number_format(
            (float) $venue->reviews()->where('is_approved', true)->where('verified', true)->avg('rating')
            ?: $customer,
            2, '.', ''
        );

        // overall بسيط
        $overall = (float) number_format(($platform + $customer) / 2, 2, '.', '');

        // توزيع النجوم 1..5 (تقريب للتوزيع)
        $counts = [];
        for ($i = 1; $i <= 5; $i++) {
            $counts[(string)$i] = (int) $venue->reviews()
                ->where('is_approved', true)
                ->whereBetween('rating', [$i - 0.5, $i + 0.49]) // تقريب
                ->count();
        }

        return compact('platform', 'customer', 'overall', 'counts');
    }
}

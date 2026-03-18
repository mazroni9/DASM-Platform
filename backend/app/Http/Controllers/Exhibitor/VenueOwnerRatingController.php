<?php

namespace App\Http\Controllers\Exhibitor;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreVenueOwnerReviewRequest;
use App\Http\Requests\UpdateVenueOwnerReviewRequest;
use App\Models\VenueOwner;
use App\Models\VenueOwnerReview;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;

class VenueOwnerRatingController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        $venue = VenueOwner::where('user_id', $userId)->firstOrFail();

        $perPage = (int) $request->get('per_page', 10);

        $reviews = $venue->reviews()
            ->with(['user:id,name'])
            ->where('is_approved', true)
            ->latest()
            ->paginate($perPage);

        $summary = $this->buildSummary($venue);

        // ✅ شكل ثابت مناسب للفرونت
        $mapped = $reviews->getCollection()->map(function (VenueOwnerReview $r) {
            return [
                'id'         => (int) $r->id,
                'user_name'  => $r->user?->name ?? 'مستخدم',
                'comment'    => $r->comment,
                'rating'     => (float) $r->rating,
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
                'counts'          => $summary['counts'],
                'reviews'         => $reviews,
            ],
        ]);
    }

    public function store(StoreVenueOwnerReviewRequest $request)
    {
        $user = $request->user();
        $venue = VenueOwner::findOrFail($request->venue_owner_id);

        if ($venue->user_id === $user->id) {
            return response()->json(['message' => 'لا يمكنك تقييم معرضك!'], 422);
        }

        $exists = VenueOwnerReview::where('venue_owner_id', $venue->id)
            ->where('user_id', $user->id)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'لقد قيّمت هذا المعرض مسبقاً.'], 422);
        }

        $review = VenueOwnerReview::create([
            'venue_owner_id' => $venue->id,
            'user_id'        => $user->id,
            'rating'         => $request->rating,
            'comment'        => $request->comment,
            'verified'       => false,
            'is_approved'    => true,
        ]);

        $venue->recalcRating();

        return response()->json([
            'success' => true,
            'data' => $review,
            'message' => 'تم إضافة المراجعة.',
        ], 201);
    }

    public function update(UpdateVenueOwnerReviewRequest $request, VenueOwnerReview $review)
    {
        Gate::authorize('update', $review);

        $allowedFields = ['rating', 'comment'];

        if (Gate::allows('verify', $review)) {
            $allowedFields[] = 'verified';
        }
        if (Gate::allows('approve', $review)) {
            $allowedFields[] = 'is_approved';
        }

        $review->fill($request->only($allowedFields))->save();

        $review->venueOwner->recalcRating();

        return response()->json(['success' => true, 'data' => $review]);
    }

    public function destroy(Request $request, VenueOwnerReview $review)
    {
        Gate::authorize('delete', $review);

        $venue = $review->venueOwner;
        $review->delete();
        $venue->recalcRating();

        return response()->json(['success' => true, 'message' => 'تم الحذف.']);
    }

    public function summary(Request $request)
    {
        $venue = VenueOwner::where('user_id', $request->user()->id)->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $this->buildSummary($venue),
        ]);
    }

    private function buildSummary(VenueOwner $venue): array
    {
        $stats = DB::table('venue_owner_reviews')
            ->where('venue_owner_id', $venue->id)
            ->where('is_approved', true)
            ->selectRaw('
                COUNT(*) as total_count,
                AVG(rating) as customer_avg,
                AVG(CASE WHEN verified IS TRUE THEN rating ELSE NULL END) as platform_avg,
                SUM(CASE WHEN rating >= 0.5 AND rating < 1.5 THEN 1 ELSE 0 END) as star_1,
                SUM(CASE WHEN rating >= 1.5 AND rating < 2.5 THEN 1 ELSE 0 END) as star_2,
                SUM(CASE WHEN rating >= 2.5 AND rating < 3.5 THEN 1 ELSE 0 END) as star_3,
                SUM(CASE WHEN rating >= 3.5 AND rating < 4.5 THEN 1 ELSE 0 END) as star_4,
                SUM(CASE WHEN rating >= 4.5 THEN 1 ELSE 0 END) as star_5
            ')
            ->first();

        $customer = (float) number_format((float) ($stats->customer_avg ?? 0), 2, '.', '');

        // لو مفيش verified reviews خالص، platform_avg هتبقى null -> نخليها customer
        $platform = (float) number_format((float) (($stats->platform_avg ?? null) ?? $customer), 2, '.', '');

        $overall = (float) number_format(($platform + $customer) / 2, 2, '.', '');

        $counts = [
            '1' => (int) ($stats->star_1 ?? 0),
            '2' => (int) ($stats->star_2 ?? 0),
            '3' => (int) ($stats->star_3 ?? 0),
            '4' => (int) ($stats->star_4 ?? 0),
            '5' => (int) ($stats->star_5 ?? 0),
        ];

        return compact('platform', 'customer', 'overall', 'counts');
    }
}

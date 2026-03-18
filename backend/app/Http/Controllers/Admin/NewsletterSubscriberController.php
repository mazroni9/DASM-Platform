<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\NewsletterSubscriber;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class NewsletterSubscriberController extends Controller
{
    public function index(Request $request)
    {
        $q = trim((string) $request->query('q', ''));
        $status = $request->query('status'); // subscribed/unsubscribed
        $perPage = (int) $request->query('per_page', 20);
        $perPage = max(5, min($perPage, 200));

        $query = NewsletterSubscriber::query()->orderByDesc('id');

        if ($q !== '') {
            $query->where('email', 'like', "%{$q}%");
        }
        if ($status) {
            $query->where('status', $status);
        }

        return response()->json([
            'success' => true,
            'data' => $query->paginate($perPage),
        ]);
    }

    public function update(Request $request, NewsletterSubscriber $subscriber)
    {
        $data = $request->validate([
            'status' => ['nullable', 'in:subscribed,unsubscribed'],
            'notes'  => ['nullable', 'string', 'max:2000'],
        ]);

        $subscriber->fill($data);
        $subscriber->save();

        return response()->json([
            'success' => true,
            'message' => 'تم التعديل بنجاح ✅',
            'data' => $subscriber,
        ]);
    }

    public function destroy(NewsletterSubscriber $subscriber)
    {
        $subscriber->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم الحذف بنجاح ✅',
        ]);
    }

    /**
     * Export monthly list (CSV opens in Excel)
     * GET /api/admin/newsletter-subscribers/export?month=2026-02&status=subscribed
     */
    public function export(Request $request)
    {
        $month = $request->query('month'); // YYYY-MM
        $status = $request->query('status'); // optional

        $start = $month
            ? Carbon::createFromFormat('Y-m', $month)->startOfMonth()
            : now()->startOfMonth();

        $end = (clone $start)->endOfMonth();

        $query = NewsletterSubscriber::query()
            ->whereBetween('created_at', [$start, $end])
            ->orderBy('id', 'asc');

        if ($status) {
            $query->where('status', $status);
        }

        $rows = $query->get(['id', 'email', 'status', 'source', 'created_at']);

        $filename = 'newsletter_' . $start->format('Y_m') . '.csv';

        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($rows) {
            $out = fopen('php://output', 'w');

            // UTF-8 BOM for Excel Arabic compatibility
            fwrite($out, "\xEF\xBB\xBF");

            fputcsv($out, ['ID', 'Email', 'Status', 'Source', 'Created At']);

            foreach ($rows as $r) {
                fputcsv($out, [
                    $r->id,
                    $r->email,
                    $r->status,
                    $r->source,
                    optional($r->created_at)->toDateTimeString(),
                ]);
            }

            fclose($out);
        };

        return response()->stream($callback, 200, $headers);
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\YouTubeChannel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\Rule;

class YouTubeChannelController extends Controller
{
    private function orgId(Request $request): ?int
    {
        // 1) لو middleware حاطط attribute
        $attr = $request->attributes->get('organization_id');
        if ($attr) return (int) $attr;

        // 2) لو user عنده organization_id
        $u = $request->user();
        foreach (['organization_id', 'current_organization_id', 'org_id'] as $k) {
            if (isset($u->{$k}) && $u->{$k}) return (int) $u->{$k};
        }

        return null;
    }

    private function scopeOrg(Request $request, $query)
    {
        $orgId = $this->orgId($request);
        if ($orgId !== null) {
            return $query->where('organization_id', $orgId);
        }
        return $query->whereNull('organization_id');
    }

    public function index(Request $request)
    {
        $q = $this->scopeOrg($request, YouTubeChannel::query())
            ->orderByDesc('id');

        // لو عايز pagination:
        // return response()->json(['status' => 'success', 'data' => $q->paginate(15)]);
        return response()->json($q->get());
    }

    public function store(Request $request)
    {
        $orgId = $this->orgId($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'channel_id' => [
                'required',
                'string',
                'max:255',
                Rule::unique('youtube_channels', 'channel_id')
                    ->where(fn($q) => $orgId !== null ? $q->where('organization_id', $orgId) : $q->whereNull('organization_id')),
            ],
        ]);

        $row = new YouTubeChannel();
        $row->organization_id = $orgId;
        $row->name = $data['name'];
        $row->channel_id = $data['channel_id'];
        $row->created_by = $request->user()?->id;
        $row->save();

        return response()->json(['status' => 'success', 'data' => $row], 201);
    }

    public function show(Request $request, int $id)
    {
        $row = $this->scopeOrg($request, YouTubeChannel::query())->findOrFail($id);
        return response()->json(['status' => 'success', 'data' => $row]);
    }

    public function update(Request $request, int $id)
    {
        $orgId = $this->orgId($request);
        $row = $this->scopeOrg($request, YouTubeChannel::query())->findOrFail($id);

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'channel_id' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('youtube_channels', 'channel_id')
                    ->ignore($row->id)
                    ->where(fn($q) => $orgId !== null ? $q->where('organization_id', $orgId) : $q->whereNull('organization_id')),
            ],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $row->fill($data);
        $row->save();

        return response()->json(['status' => 'success', 'data' => $row]);
    }

    public function destroy(Request $request, int $id)
    {
        $row = $this->scopeOrg($request, YouTubeChannel::query())->findOrFail($id);
        $row->delete();

        return response()->json(['status' => 'success', 'message' => 'deleted']);
    }

    /**
     * Optional: Sync stats from YouTube API (needs YOUTUBE_API_KEY in .env)
     */
    public function sync(Request $request, int $id)
    {
        $row = $this->scopeOrg($request, YouTubeChannel::query())->findOrFail($id);

        $key = env('YOUTUBE_API_KEY');
        if (!$key) {
            return response()->json([
                'message' => 'YOUTUBE_API_KEY is not set. Add it to .env to enable sync.'
            ], 422);
        }

        // 1) Channel statistics
        $chRes = Http::timeout(15)->get('https://www.googleapis.com/youtube/v3/channels', [
            'part' => 'statistics',
            'id' => $row->channel_id,
            'key' => $key,
        ]);

        if (!$chRes->ok()) {
            return response()->json([
                'message' => 'Failed to fetch channel statistics from YouTube.',
                'details' => $chRes->json(),
            ], 422);
        }

        $items = $chRes->json('items') ?? [];
        if (!count($items)) {
            return response()->json(['message' => 'Channel not found on YouTube.'], 422);
        }

        $stats = $items[0]['statistics'] ?? [];
        $row->subscriber_count = (int) ($stats['subscriberCount'] ?? $row->subscriber_count);
        $row->video_count = (int) ($stats['videoCount'] ?? $row->video_count);

        // 2) Latest video date (search endpoint)
        $searchRes = Http::timeout(15)->get('https://www.googleapis.com/youtube/v3/search', [
            'part' => 'snippet',
            'channelId' => $row->channel_id,
            'order' => 'date',
            'maxResults' => 1,
            'type' => 'video',
            'key' => $key,
        ]);

        if ($searchRes->ok()) {
            $sItems = $searchRes->json('items') ?? [];
            if (count($sItems)) {
                $publishedAt = $sItems[0]['snippet']['publishedAt'] ?? null;
                if ($publishedAt) {
                    $row->last_video_date = $publishedAt;
                }
            }
        }

        $row->save();

        return response()->json(['status' => 'success', 'data' => $row]);
    }
}

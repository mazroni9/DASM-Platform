<?php

namespace App\Services;

use App\Models\Auction;
use App\Models\Bid;
use App\Models\BidSensitiveContextLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Persists session/browser geolocation context for sensitive bid actions.
 * Designed for future fraud/risk analytics — no scoring logic in this phase.
 */
final class BidSensitiveContextLogService
{
    private const VALID_PERMISSION = [
        'granted', 'denied', 'unavailable', 'prompt', 'prompt_dismissed',
    ];

    private const VALID_SOURCE = ['browser', 'none', 'ip'];

    private const VALID_ONLINE = ['online', 'offline'];

    public function recordForBid(User $user, Request $request, Auction $auction, Bid $bid): void
    {
        try {
            $normalized = $this->normalizePayload($request);

            BidSensitiveContextLog::create([
                'user_id' => $user->id,
                'auction_id' => $auction->id,
                'car_id' => $auction->car_id,
                'bid_id' => $bid->id,
                'client_session_id' => $normalized['client_session_id'],
                'ip_address' => $request->ip(),
                'user_agent' => $this->truncateUa($request->userAgent()),
                'geolocation_source' => $normalized['geolocation_source'],
                'permission_state' => $normalized['permission_state'],
                'latitude' => $normalized['latitude'],
                'longitude' => $normalized['longitude'],
                'accuracy_meters' => $normalized['accuracy_meters'],
                'city' => $normalized['city'],
                'region' => $normalized['region'],
                'captured_at' => $normalized['captured_at'],
                'risk_flags' => $normalized['risk_flags'],
                'metadata' => array_merge([
                    'endpoint' => 'bid',
                ], $normalized['metadata']),
            ]);
        } catch (\Throwable $e) {
            Log::warning('BidSensitiveContextLogService::recordForBid failed', [
                'user_id' => $user->id,
                'auction_id' => $auction->id,
                'bid_id' => $bid->id,
                'message' => $e->getMessage(),
            ]);
        }
    }

    /**
     * @return array{
     *   client_session_id: ?string,
     *   geolocation_source: string,
     *   permission_state: string,
     *   latitude: ?float,
     *   longitude: ?float,
     *   accuracy_meters: ?float,
     *   city: ?string,
     *   region: ?string,
     *   captured_at: ?\Carbon\Carbon,
     *   risk_flags: ?array,
     *   metadata: array,
     *   online_status: ?string,
     *   network_effective_type: ?string,
     *   network_downlink: ?float
     * }
     */
    private function normalizePayload(Request $request): array
    {
        $clientSessionId = $request->input('client_session_id');
        $clientSessionId = is_string($clientSessionId) ? substr(trim($clientSessionId), 0, 128) : null;
        if ($clientSessionId === '') {
            $clientSessionId = null;
        }

        $sl = $request->input('session_location');
        $sl = is_array($sl) ? $sl : [];

        $permission = strtolower((string) ($sl['permission_state'] ?? 'unavailable'));
        if (! in_array($permission, self::VALID_PERMISSION, true)) {
            $permission = 'unavailable';
        }

        $source = strtolower((string) ($sl['geolocation_source'] ?? 'none'));
        if (! in_array($source, self::VALID_SOURCE, true)) {
            $source = 'none';
        }

        $lat = $this->optionalFloat($sl['latitude'] ?? null);
        $lng = $this->optionalFloat($sl['longitude'] ?? null);
        if ($lat !== null && ($lat < -90 || $lat > 90)) {
            $lat = null;
        }
        if ($lng !== null && ($lng < -180 || $lng > 180)) {
            $lng = null;
        }

        $accuracy = $this->optionalFloat($sl['accuracy_meters'] ?? null);
        if ($accuracy !== null && $accuracy < 0) {
            $accuracy = null;
        }

        $city = isset($sl['city']) && is_string($sl['city']) ? substr(trim($sl['city']), 0, 191) : null;
        $region = isset($sl['region']) && is_string($sl['region']) ? substr(trim($sl['region']), 0, 191) : null;
        if ($city === '') {
            $city = null;
        }
        if ($region === '') {
            $region = null;
        }

        $capturedAt = null;
        if (! empty($sl['captured_at']) && is_string($sl['captured_at'])) {
            try {
                $capturedAt = \Carbon\Carbon::parse($sl['captured_at']);
            } catch (\Throwable) {
                $capturedAt = null;
            }
        }

        $riskFlags = $sl['risk_flags'] ?? null;
        if ($riskFlags !== null && ! is_array($riskFlags)) {
            $riskFlags = null;
        }

        $metadata = $sl['metadata'] ?? [];
        if (! is_array($metadata)) {
            $metadata = [];
        }

        $onlineRaw = strtolower((string) ($sl['online_status'] ?? ''));
        $onlineStatus = in_array($onlineRaw, self::VALID_ONLINE, true) ? $onlineRaw : null;

        $netType = isset($sl['network_effective_type']) && is_string($sl['network_effective_type'])
            ? substr(trim($sl['network_effective_type']), 0, 32) : null;
        if ($netType === '') {
            $netType = null;
        }

        $downlink = $this->optionalFloat($sl['network_downlink'] ?? null);
        if ($downlink !== null && $downlink > 9999.99) {
            $downlink = null;
        }

        return [
            'client_session_id' => $clientSessionId,
            'geolocation_source' => $source,
            'permission_state' => $permission,
            'latitude' => $lat,
            'longitude' => $lng,
            'accuracy_meters' => $accuracy,
            'city' => $city,
            'region' => $region,
            'captured_at' => $capturedAt,
            'risk_flags' => $riskFlags,
            'metadata' => $metadata,
            'online_status' => $onlineStatus,
            'network_effective_type' => $netType,
            'network_downlink' => $downlink,
        ];
    }

    private function optionalFloat(mixed $v): ?float
    {
        if ($v === null || $v === '') {
            return null;
        }
        if (is_numeric($v)) {
            return (float) $v;
        }

        return null;
    }

    private function truncateUa(?string $ua): ?string
    {
        if ($ua === null || $ua === '') {
            return null;
        }

        return substr($ua, 0, 2000);
    }
}

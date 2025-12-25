<?php

namespace App\Services;

use App\Models\Auction;
use App\Models\Bid;
use App\Models\BidEvent;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use InvalidArgumentException;

class BidEventService
{
    /**
     * Log a bid event.
     *
     * @param string $eventType
     * @param Auction $auction
     * @param Request $request
     * @param array $context
     * @return BidEvent
     */
    public function log(string $eventType, Auction $auction, Request $request, array $context = []): BidEvent
    {
        $baseData = $this->getBaseData($request);
        $eventData = [];

        switch ($eventType) {
            case 'bid_placed':
                /** @var Bid $bid */
                $bid = $context['bid'];
                /** @var User $user */
                $user = $context['user'];
                $eventData = [
                    'bid_id' => $bid->id,
                    'bidder_id' => $user->id,
                    'bid_amount' => $bid->bid_amount,
                ];
                break;

            case 'outbid':
                /** @var Bid $lastBid */
                $lastBid = $context['last_bid'];
                /** @var Bid $newBid */
                $newBid = $context['new_bid'];
                $eventData = [
                    'bid_id' => $lastBid->id,
                    'bidder_id' => $lastBid->user_id,
                    'bid_amount' => $newBid->bid_amount,
                ];
                break;

            default:
                throw new InvalidArgumentException("Unknown bid event type: {$eventType}");
        }

        $dataForEvent = array_merge(
            $baseData,
            [
                'auction_id' => $auction->id,
                'event_type' => $eventType,
            ],
            $eventData
        );

        $hashes = $this->getEventHashes($dataForEvent);
        $dataForEvent['hash_prev'] = $hashes['hash_prev'];
        $dataForEvent['hash_curr'] = $hashes['hash_curr'];


        return BidEvent::create($dataForEvent);
    }

    /**
     * Calculate the chained hashes for a bid event.
     *
     * @param array $eventData
     * @return array
     */
    private function getEventHashes(array $eventData): array
    {
        // Get the hash of the very last event recorded to create a chain.
        $lastEvent = BidEvent::latest('id')->first();
        $hash_prev = $lastEvent ? $lastEvent->hash_curr : null;

        $dataToHash = $eventData;
        $dataToHash['hash_prev'] = $hash_prev;

        // Create a consistent representation of the data to hash.
        ksort($dataToHash);
        $encodedData = json_encode($dataToHash);

        // Calculate the new hash.
        $hash_curr = hash('sha256', $encodedData);

        return [
            'hash_prev' => $hash_prev,
            'hash_curr' => $hash_curr,
        ];
    }

    /**
     * Get base data for a bid event.
     *
     * @param Request $request
     * @return array
     */
    private function getBaseData(Request $request): array
    {
        $user = $request->user('sanctum');
        $currentToken = $user->currentAccessToken();
        // استخدم الـ id الخاص بالتوكن كـ session_id
        $tokenId = $currentToken ? $currentToken->id : null;
        return [
            'currency' => 'SAR',
            'channel' => 'web',
            'reason_code' => null,
            'server_ts_utc' => Carbon::now()->toDateTimeString(),
            'client_ts' => $request->client_ts ?? Carbon::now()->toDateTimeString(),
            'server_nano_seq' => hrtime(true),
            'ip_addr' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'session_id' => $tokenId,
        ];
    }
}

<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserBidLogResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */

    /*
     my data:
       'auction_id',
        'bid_id',
        'bidder_id',
        'bid_amount',
        'currency',
        'channel',
        'event_type' => ['bid_placed', 'bid_rejected', 'outbid', 'autobid_fired', 'bid_withdrawn'],
        'reason_code',
        'server_ts_utc',
        'client_ts',
        'server_nano_seq',
        'ip_addr',
        'user_agent',
        'session_id',
        'hash_prev',
        'hash_curr',
     */
    public function toArray(Request $request): array
    {
        $event_type = $this->event_type;
        $event = '';
        //['bid_placed', 'bid_rejected', 'outbid', 'autobid_fired', 'bid_withdrawn']
        switch ($event_type) {
            case 'bid_placed':
                $event = "لقد قمت بالمزايدة بملغ " . $this->bid_amount;
                break;
            case 'outbid':
                $event = "تم تجاوز مزايدتك بملغ جديد قيمته :" . $this->bid_amount;
                break;
            default:
                $event = $event_type;
                break;
        }
        return [
            'auction_id' => $this->auction_id,
            'bid_id' => $this->bid_id,
            'bidder_id' => $this->bidder_id,
            'bid_amount' => $this->bid_amount,
            'currency' => $this->currency,
            'channel' => $this->channel,
            'event_type' => $this->event_type,
            'event' => $event,
            'reason_code' => $this->reason_code,
            'server_ts_utc' => $this->server_ts_utc,
            'client_ts' => $this->client_ts,
        ];
    }
}

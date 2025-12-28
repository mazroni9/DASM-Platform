<?php

use Illuminate\Support\Facades\Broadcast;

// Public auction channel
Broadcast::channel('auction.{auction_id}', function () {
    return true;
});

Broadcast::channel('auction', function () {
    return true;
});

// Private Dealer Channels
Broadcast::channel('dealer.{userId}.wallet', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

Broadcast::channel('dealer.{userId}.ai', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

Broadcast::channel('dealer.{userId}.system', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

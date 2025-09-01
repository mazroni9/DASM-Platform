<?php

use Illuminate\Support\Facades\Broadcast;

// Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
//     return (int) $user->id === (int) $id;
// });

Broadcast::channel('auction.{auction_id}', function () {
    return true;
});
Broadcast::channel('auction', function () {
    return true;
});


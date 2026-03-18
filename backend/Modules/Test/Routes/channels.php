<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('admin.auction-tests', function ($user) {
    return $user && in_array(strtolower($user->type ?? ''), ['admin', 'super_admin'], true);
});

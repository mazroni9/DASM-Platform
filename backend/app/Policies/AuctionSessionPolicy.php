<?php

namespace App\Policies;

use App\Models\User;
use App\Models\AuctionSession;

class AuctionSessionPolicy
{
    public function viewAny(User $user): bool
    {
        // مسموح للإدمن ومالك المعرض والتاجر (حسب روتك الحالي)
        return in_array($user->type, ['admin', 'venue_owner', 'dealer'], true);
    }

    public function view(User $user, AuctionSession $session): bool
    {
        // الإدمن يشوف كل شيء — غيره يشوف جلساته فقط
        return $user->type === 'admin' || $session->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        // السماح بإنشاء الجلسات لصاحب المعرض والتاجر والإدمن
        return in_array($user->type, ['admin', 'venue_owner', 'dealer'], true);
    }

    public function update(User $user, AuctionSession $session): bool
    {
        return $user->type === 'admin' || $session->user_id === $user->id;
    }

    public function delete(User $user, AuctionSession $session): bool
    {
        return $user->type === 'admin' || $session->user_id === $user->id;
    }

    public function updateStatus(User $user, AuctionSession $session): bool
    {
        return $this->update($user, $session);
    }
}

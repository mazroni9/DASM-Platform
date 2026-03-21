<?php

namespace App\Support;

use App\Models\User;

/**
 * Builds a short, human-readable location label from persisted data only.
 * Priority: user's linked Area name, then venue owner address (short, single-line only).
 */
final class UserProfileDisplayLocation
{
    private const VENUE_ADDRESS_MAX_CHARS = 72;

    public static function resolve(?User $user): ?string
    {
        if ($user === null) {
            return null;
        }

        $user->loadMissing(['area', 'venueOwner']);

        $fromArea = self::fromArea($user);
        if ($fromArea !== null) {
            return $fromArea;
        }

        return self::fromVenueAddress($user);
    }

    private static function fromArea(User $user): ?string
    {
        $name = $user->area?->name;
        if (! is_string($name)) {
            return null;
        }

        $trimmed = trim($name);
        if ($trimmed === '') {
            return null;
        }

        return $trimmed;
    }

    private static function fromVenueAddress(User $user): ?string
    {
        $raw = $user->venueOwner?->address ?? null;
        if (! is_string($raw)) {
            return null;
        }

        $trimmed = trim($raw);
        if ($trimmed === '') {
            return null;
        }

        if (str_contains($trimmed, "\n") || str_contains($trimmed, "\r")) {
            return null;
        }

        if (mb_strlen($trimmed) > self::VENUE_ADDRESS_MAX_CHARS) {
            return null;
        }

        return $trimmed;
    }
}

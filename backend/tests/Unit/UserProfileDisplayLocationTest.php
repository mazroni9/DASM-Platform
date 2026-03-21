<?php

namespace Tests\Unit;

use App\Models\Area;
use App\Models\User;
use App\Models\VenueOwner;
use App\Support\UserProfileDisplayLocation;
use PHPUnit\Framework\TestCase;

class UserProfileDisplayLocationTest extends TestCase
{
    public function test_returns_null_without_user(): void
    {
        $this->assertNull(UserProfileDisplayLocation::resolve(null));
    }

    public function test_area_name_returned_as_stored(): void
    {
        $user = new User;
        $user->setRelation('area', new Area(['name' => 'منطقة الرياض']));
        $user->setRelation('venueOwner', null);

        $this->assertSame(
            'منطقة الرياض',
            UserProfileDisplayLocation::resolve($user)
        );
    }

    public function test_area_preserves_embedded_country_if_in_db(): void
    {
        $user = new User;
        $user->setRelation('area', new Area(['name' => 'الرياض، السعودية']));
        $user->setRelation('venueOwner', null);

        $this->assertSame('الرياض، السعودية', UserProfileDisplayLocation::resolve($user));
    }

    public function test_falls_back_to_short_venue_address_when_no_area(): void
    {
        $user = new User;
        $user->setRelation('area', null);
        $vo = new VenueOwner(['address' => 'الدمام، حي الفيصلية']);
        $user->setRelation('venueOwner', $vo);

        $this->assertSame(
            'الدمام، حي الفيصلية',
            UserProfileDisplayLocation::resolve($user)
        );
    }

    public function test_rejects_multiline_venue_address(): void
    {
        $user = new User;
        $user->setRelation('area', null);
        $vo = new VenueOwner(['address' => "الدمام\nالسعودية"]);
        $user->setRelation('venueOwner', $vo);

        $this->assertNull(UserProfileDisplayLocation::resolve($user));
    }

    public function test_rejects_long_venue_address(): void
    {
        $user = new User;
        $user->setRelation('area', null);
        $long = str_repeat('أ', 80);
        $vo = new VenueOwner(['address' => $long]);
        $user->setRelation('venueOwner', $vo);

        $this->assertNull(UserProfileDisplayLocation::resolve($user));
    }
}

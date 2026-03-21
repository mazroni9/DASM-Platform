<?php

namespace Tests\Unit;

use App\Enums\UserRole;
use PHPUnit\Framework\TestCase;

class UserRoleApprovalGroupEligibilityTest extends TestCase
{
    public function test_staff_admin_types_are_eligible(): void
    {
        $this->assertTrue(UserRole::isApprovalGroupEligibleType(UserRole::SUPER_ADMIN));
        $this->assertTrue(UserRole::isApprovalGroupEligibleType(UserRole::ADMIN));
        $this->assertTrue(UserRole::isApprovalGroupEligibleType(UserRole::MODERATOR));
        $this->assertTrue(UserRole::isApprovalGroupEligibleType(UserRole::PROGRAMMER));
    }

    public function test_non_staff_types_are_not_eligible(): void
    {
        $this->assertFalse(UserRole::isApprovalGroupEligibleType(UserRole::USER));
        $this->assertFalse(UserRole::isApprovalGroupEligibleType(UserRole::DEALER));
        $this->assertFalse(UserRole::isApprovalGroupEligibleType(UserRole::VENUE_OWNER));
        $this->assertFalse(UserRole::isApprovalGroupEligibleType(UserRole::INVESTOR));
        $this->assertFalse(UserRole::isApprovalGroupEligibleType(UserRole::EMPLOYEE));
    }

    public function test_string_type_values_match(): void
    {
        $this->assertTrue(UserRole::isApprovalGroupEligibleType('super_admin'));
        $this->assertFalse(UserRole::isApprovalGroupEligibleType('user'));
    }
}

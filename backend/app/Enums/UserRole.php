<?php

namespace App\Enums;

enum UserRole: string
{
    case SUPER_ADMIN = 'super_admin';
    case ADMIN = 'admin';
    case MODERATOR = 'moderator';
    case VENUE_OWNER = 'venue_owner';
    case INVESTOR = 'investor';
    case DEALER = 'dealer';
    case USER = 'user';
    case EMPLOYEE = 'employee';  // ✅ تمت الإضافة

    public function label(): string
    {
        return match ($this) {
            self::SUPER_ADMIN => 'Super Administrator',
            self::ADMIN => 'Administrator',
            self::MODERATOR => 'Moderator',
            self::VENUE_OWNER => 'Venue Owner',
            self::INVESTOR => 'Investor',
            self::DEALER => 'Dealer',
            self::USER => 'User',
            self::EMPLOYEE => 'Employee',  // ✅ تمت الإضافة
        };
    }

    public function labelAr(): string
    {
        return match ($this) {
            self::SUPER_ADMIN => 'مدير النظام الرئيسي',
            self::ADMIN => 'مدير النظام',
            self::MODERATOR => 'مشرف',
            self::VENUE_OWNER => 'مالك المعرض',
            self::INVESTOR => 'مستثمر',
            self::DEALER => 'تاجر',
            self::USER => 'مستخدم',
            self::EMPLOYEE => 'موظف',  // ✅ تمت الإضافة
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::SUPER_ADMIN => 'red',
            self::ADMIN => 'red',
            self::MODERATOR => 'green',
            self::VENUE_OWNER => 'purple',
            self::INVESTOR => 'yellow',
            self::DEALER => 'blue',
            self::USER => 'gray',
            self::EMPLOYEE => 'orange',  // ✅ تمت الإضافة
        };
    }

    public function isAdmin(): bool
    {
        return match ($this) {
            self::SUPER_ADMIN, self::ADMIN => true,
            default => false,
        };
    }

    /**
     * Check if role is staff level (can access admin panel)
     */
    public function isStaff(): bool
    {
        return match ($this) {
            self::SUPER_ADMIN, self::ADMIN, self::MODERATOR, self::EMPLOYEE => true,
            default => false,
        };
    }

    public function canManageAuctions(): bool
    {
        return match ($this) {
            self::SUPER_ADMIN, self::ADMIN, self::MODERATOR, self::VENUE_OWNER => true,
            default => false,
        };
    }

    public function canManageUsers(): bool
    {
        return match ($this) {
            self::SUPER_ADMIN, self::ADMIN, self::MODERATOR => true,
            default => false,
        };
    }

    public function canManageVenues(): bool
    {
        return match ($this) {
            self::SUPER_ADMIN, self::ADMIN, self::VENUE_OWNER => true,
            default => false,
        };
    }

    public function canAccessInvestments(): bool
    {
        return match ($this) {
            self::SUPER_ADMIN, self::ADMIN, self::INVESTOR => true,
            default => false,
        };
    }

    /**
     * Check if role can access admin dashboard
     */
    public function canAccessDashboard(): bool
    {
        return match ($this) {
            self::SUPER_ADMIN, self::ADMIN, self::MODERATOR, self::EMPLOYEE, self::VENUE_OWNER => true,
            default => false,
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public static function getTranslations(): array
    {
        $translations = [];
        foreach (self::cases() as $role) {
            $translations[$role->value] = [
                'en' => $role->label(),
                'ar' => $role->labelAr(),
                'color' => $role->color()
            ];
        }
        return $translations;
    }

    public static function isValid(string $value): bool
    {
        return in_array($value, self::values());
    }

    public static function fromString(string $value): ?self
    {
        return self::tryFrom($value);
    }

    /**
     * Get admin-level roles
     */
    public static function adminRoles(): array
    {
        return [
            self::SUPER_ADMIN,
            self::ADMIN,
        ];
    }

    /**
     * Get staff-level roles (can access backend)
     */
    public static function staffRoles(): array
    {
        return [
            self::SUPER_ADMIN,
            self::ADMIN,
            self::MODERATOR,
            self::EMPLOYEE,
        ];
    }

    /**
     * Get business roles
     */
    public static function businessRoles(): array
    {
        return [
            self::VENUE_OWNER,
            self::INVESTOR,
            self::DEALER,
        ];
    }
}

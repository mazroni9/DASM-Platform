<?php

namespace App\Enums;

enum UserRole: string
{
    case ADMIN = 'admin';
    case MODERATOR = 'moderator';
    case VENUE_OWNER = 'venue_owner';
    case INVESTOR = 'investor';
    case DEALER = 'dealer';
    case USER = 'user';

    /**
     * Get the display label for the role
     */
    public function label(): string
    {
        return match($this) {
            self::ADMIN => 'Administrator',
            self::MODERATOR => 'Moderator',
            self::VENUE_OWNER => 'Venue Owner',
            self::INVESTOR => 'Investor',
            self::DEALER => 'Dealer',
            self::USER => 'User',
        };
    }

    /**
     * Get the Arabic label for the role
     */
    public function labelAr(): string
    {
        return match($this) {
            self::ADMIN => 'مدير النظام',
            self::MODERATOR => 'مشرف',
            self::VENUE_OWNER => 'مالك المعرض',
            self::INVESTOR => 'مستثمر',
            self::DEALER => 'تاجر',
            self::USER => 'مستخدم',
        };
    }

    /**
     * Get the UI color for the role badge
     */
    public function color(): string
    {
        return match($this) {
            self::ADMIN => 'red',
            self::MODERATOR => 'green',
            self::VENUE_OWNER => 'purple',
            self::INVESTOR => 'yellow',
            self::DEALER => 'blue',
            self::USER => 'gray',
        };
    }

    /**
     * Check if the role has administrative privileges
     */
    public function isAdmin(): bool
    {
        return match($this) {
            self::ADMIN => true,
            default => false,
        };
    }

    /**
     * Check if the role can manage auctions
     */
    public function canManageAuctions(): bool
    {
        return match($this) {
            self::ADMIN, self::MODERATOR, self::VENUE_OWNER => true,
            default => false,
        };
    }

    /**
     * Check if the role can manage users
     */
    public function canManageUsers(): bool
    {
        return match($this) {
            self::ADMIN, self::MODERATOR => true,
            default => false,
        };
    }

    /**
     * Check if the role can access venue management
     */
    public function canManageVenues(): bool
    {
        return match($this) {
            self::ADMIN, self::VENUE_OWNER => true,
            default => false,
        };
    }

    /**
     * Check if the role can access investment features
     */
    public function canAccessInvestments(): bool
    {
        return match($this) {
            self::ADMIN, self::INVESTOR => true,
            default => false,
        };
    }

    /**
     * Get all available role values as array
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Get all roles with their translations
     */
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

    /**
     * Validate if a string value is a valid role
     */
    public static function isValid(string $value): bool
    {
        return in_array($value, self::values());
    }

    /**
     * Get role from string value
     */
    public static function fromString(string $value): ?self
    {
        return self::tryFrom($value);
    }
}

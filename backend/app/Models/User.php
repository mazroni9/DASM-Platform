<?php

namespace App\Models;

use App\Enums\UserStatus;
use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;
use Illuminate\Contracts\Auth\MustVerifyEmail;

use App\Models\DeviceToken;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable;


    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'phone',
        'password_hash',
        'role',
        'kyc_status',
        'email_verified_at',
        'email_verification_token',
        'password_reset_token',
        'password_reset_expires_at',
        'is_active',
        'status',
        'keycloak_uuid'
    ];

    // Casts for automatic type conversion
    protected $casts = [
        'is_active' => 'boolean',
        'email_verified_at' => 'datetime',
        'password_reset_expires_at' => 'datetime',
        'status' => UserStatus::class,
        'role' => UserRole::class,
    ];

    // Relationships

    // A User may have many bids.
    public function bids()
    {
        return $this->hasMany(Bid::class);
    }

    // A User may have one wallet.
    public function wallet()
    {
        return $this->hasOne(Wallet::class);
    }

    // If the user is a dealer, they have one dealer record.
    public function dealer()
    {
        return $this->hasOne(Dealer::class);
    }

    // ✅ If the user is a venue owner
public function venueOwner()
{
    return $this->hasOne(\App\Models\VenueOwner::class, 'user_id');
}

    public function deviceTokens()
    {
        return $this->hasMany(DeviceToken::class);
    }

    public function routeNotificationForFcm()
    {
        return $this->deviceTokens()->pluck('token')->toArray();
    }

    // Check if email is verified
    public function hasVerifiedEmail()
    {
        return $this->email_verified_at !== null;
    }

    // Mark email as verified
    public function markEmailAsVerified()
    {
        return $this->forceFill([
            'email_verified_at' => now(),
            'email_verification_token' => null,
            'is_active' => false,
            'status' => UserStatus::PENDING,
        ])->save();
    }

    // Role checking methods
    public function isAdmin(): bool
    {
        return $this->role === UserRole::ADMIN;
    }

    public function isDealer(): bool
    {
        return $this->role === UserRole::DEALER;
    }

    public function isModerator(): bool
    {
        return $this->role === UserRole::MODERATOR;
    }

    public function isVenueOwner(): bool
    {
        return $this->role === UserRole::VENUE_OWNER;
    }

    public function isInvestor(): bool
    {
        return $this->role === UserRole::INVESTOR;
    }

    public function isUser(): bool
    {
        return $this->role === UserRole::USER;
    }

    public function hasRole(UserRole $role): bool
    {
        return $this->role === $role;
    }

    public function canManageAuctions(): bool
    {
        return $this->role->canManageAuctions();
    }

    public function canManageUsers(): bool
    {
        return $this->role->canManageUsers();
    }

    public function canManageVenues(): bool
    {
        return $this->role->canManageVenues();
    }

    public function canAccessInvestments(): bool
    {
        return $this->role->canAccessInvestments();
    }
}

<?php

namespace App\Models;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\DeviceToken;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;
use Spatie\Activitylog\Traits\CausesActivity;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable, CausesActivity, LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
        ->setDescriptionForEvent(function(string $eventName) {
            switch ($eventName) {
                case 'created':
                    return "تم إنشاء المستخدم رقم {$this->id}";
                case 'updated':
                    return "تم تحديث المستخدم رقم {$this->id}";
                case 'deleted':
                    return "تم حذف المستخدم رقم {$this->id}";
            }
            return "User {$eventName}";
        })->logFillable()
        ->useLogName('user_log');
    }

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
        'area_id',
        'user_code'
    ];

    // Casts for automatic type conversion
    protected $casts = [
        'is_active' => 'boolean',
        'email_verified_at' => 'datetime',
        'password_reset_expires_at' => 'datetime',
        'status' => UserStatus::class,
        'role' => UserRole::class,
    ];

    protected static function boot()
    {
        parent::boot();

        static::created(function ($user) {
            if ($user->role == UserRole::USER) {
                $user_code = 'Usr_'.$user->area?->code.'_0'.$user->id;
            }elseif ($user->role == UserRole::DEALER) {
                $user_code = 'Dlr_'.$user->area?->code.'_0'.$user->id;
            }elseif ($user->role == UserRole::VENUE_OWNER) {
                $user_code = 'Csr_'.$user->area?->code.'_0'.$user->id;
            }elseif ($user->role == UserRole::INVESTOR) {
                $user_code = 'Inv_'.$user->area?->code.'_0'.$user->id;
            }
            else{
                $user_code = Str::limit((ucfirst($user->role)),3,'').$user->area?->code.'_0'.$user->id;
            }
            $user->user_code = $user_code;
            $user->saveQuietly();
        });

        static::updating(function ($user) {
            if ($user->role == UserRole::USER) {
                $user_code = 'Usr_'.$user->area?->code.'_0'.$user->id;
            }elseif ($user->role == UserRole::DEALER) {
                $user_code = 'Dlr_'.$user->area?->code.'_0'.$user->id;
            }elseif ($user->role == UserRole::VENUE_OWNER) {
                $user_code = 'Csr_'.$user->area?->code.'_0'.$user->id;
            }elseif ($user->role == UserRole::INVESTOR) {
                $user_code = 'Inv_'.$user->area?->code.'_0'.$user->id;
            }
            else{
                $role = $user->role->value;
                $user_code = Str::limit((ucfirst($role)),3,'_').$user->area?->code.'_0'.$user->id;
            }
            $user->user_code = $user_code;
        });
    }

    // Relationships
    public function area()
    {
        return $this->belongsTo(Area::class);
    }

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

    public function getNameAttribute(): string
    {
        return $this->first_name . ' ' . $this->last_name;
    }
}

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
use Spatie\Permission\Traits\HasRoles;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable, CausesActivity, LogsActivity, HasRoles;

    protected $guard_name = 'sanctum';
    protected function getDefaultGuardName(): string
    {
        return $this->guard_name;
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->setDescriptionForEvent(function (string $eventName) {
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
        'type',
        'kyc_status',
        'email_verified_at',
        'email_verification_token',
        'password_reset_token',
        'password_reset_expires_at',
        'is_active',
        'status',
        'area_id',
        'user_code',
        'organization_id'
    ];

    public function getAuthPassword()
    {
        return $this->password_hash; // Return the value of your custom password column
    }

    // Casts for automatic type conversion
    protected $casts = [
        'is_active' => 'boolean',
        'email_verified_at' => 'datetime',
        'password_reset_expires_at' => 'datetime',
        'status' => UserStatus::class,
        'type' => UserRole::class, // ✅ type is Enum now
    ];

    /**
     * ✅ Helper: get role value as string no matter if enum/string/null
     */
    private function typeValue(): string
    {
        $t = $this->type;

        // When casted, $t is UserRole enum
        if ($t instanceof UserRole) return $t->value;

        // fallback if DB returns string or something else
        if (is_string($t)) return $t;

        return (string) $t;
    }

    /**
     * ✅ Helper: generate user_code safely (no crashes with enum)
     */
    private function generateUserCode(): string
    {
        $role = $this->type; // enum غالبًا
        $areaCode = $this->area?->code ?? '';
        $id = $this->id;

        if ($role === UserRole::USER) {
            return 'Usr_' . $areaCode . '_0' . $id;
        } elseif ($role === UserRole::DEALER) {
            return 'Dlr_' . $areaCode . '_0' . $id;
        } elseif ($role === UserRole::VENUE_OWNER) {
            return 'Csr_' . $areaCode . '_0' . $id;
        } elseif ($role === UserRole::INVESTOR) {
            return 'Inv_' . $areaCode . '_0' . $id;
        }

        // ✅ fallback لأي Role تاني (employee/admin/...):
        $roleValue = $this->typeValue(); // string safe
        // مثال: "employee" => "Emp"
        $prefix = Str::limit(ucfirst($roleValue), 3, '');
        return $prefix . $areaCode . '_0' . $id;
    }

    protected static function boot()
    {
        parent::boot();

        static::created(function ($user) {
            // ✅ type is enum بسبب casts، فبنستخدم generator آمن
            $user->user_code = $user->generateUserCode();
            $user->saveQuietly();
        });

        static::updating(function ($user) {
            // ✅ نفس الفكرة في update
            $user->user_code = $user->generateUserCode();
        });
    }

    // Relationships
    public function area()
    {
        return $this->belongsTo(Area::class);
    }

    /**
     * Get the organization that the user belongs to.
     */
    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Get the organization that the user has.
     */
    public function ownedOrganization()
    {
        return $this->hasOne(Organization::class, 'owner_id');
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

    // ✅ If the user is a venue owner
    public function venueOwner()
    {
        return $this->hasOne(VenueOwner::class, 'user_id');
    }

    public function deviceTokens()
    {
        return $this->hasMany(DeviceToken::class);
    }

    public function cars()
    {
        return $this->hasMany(Car::class);
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
            'is_active' => $this->type === UserRole::USER ? true : false,
            'status' => $this->type === UserRole::USER ? UserStatus::ACTIVE : UserStatus::PENDING,
        ])->save();
    }

    // Role checking methods
    public function isAdmin(): bool
    {
        return $this->type === UserRole::ADMIN || $this->type === UserRole::SUPER_ADMIN;
    }

    public function isDealer(): bool
    {
        return $this->type === UserRole::DEALER;
    }

    public function isModerator(): bool
    {
        return $this->type === UserRole::MODERATOR;
    }

    public function isVenueOwner(): bool
    {
        return $this->type === UserRole::VENUE_OWNER;
    }

    public function isInvestor(): bool
    {
        return $this->type === UserRole::INVESTOR;
    }

    public function isUser(): bool
    {
        return $this->type === UserRole::USER;
    }

    public function hasUserRole(UserRole $role): bool
    {
        return $this->type === $role;
    }

    public function canManageAuctions(): bool
    {
        return $this->type->canManageAuctions();
    }

    public function canManageUsers(): bool
    {
        return $this->type->canManageUsers();
    }

    public function canManageVenues(): bool
    {
        return $this->type->canManageVenues();
    }

    public function canAccessInvestments(): bool
    {
        return $this->type->canAccessInvestments();
    }

    public function getNameAttribute(): string
    {
        return trim(($this->first_name ?? '') . ' ' . ($this->last_name ?? ''));
    }
}

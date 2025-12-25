<?php

namespace App\Models;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use Illuminate\Support\Facades\Hash;
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
    protected function getDefaultGuardName(): string { return $this->guard_name; }

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

    protected $hidden = [
        'password',
        'password_hash',
        'remember_token',
        'email_verification_token',
        'password_reset_token',
    ];

    public function getAuthPassword()
    {
        // Laravel auth will use this column instead of "password"
        return $this->password_hash;
    }

    // Casts for automatic type conversion
    protected $casts = [
        'is_active' => 'boolean',
        'email_verified_at' => 'datetime',
        'password_reset_expires_at' => 'datetime',
        'status' => UserStatus::class,
        'type' => UserRole::class,
    ];

    /**
     * ✅ مهم: لو أي كود بيعمل $user->password = ...
     * هنضمن إن password_hash يتعبّي تلقائيًا (ومايبقاش null)
     */
    public function setPasswordAttribute($value): void
    {
        if ($value === null || $value === '') {
            return;
        }

        $hashed = $this->normalizePasswordValue((string) $value);

        // نخزن في العمود الأساسي عندك
        $this->attributes['password_hash'] = $hashed;

        // لو عندك عمود password في قاعدة البيانات (واضح من اللوج إنه موجود)
        $this->attributes['password'] = $hashed;
    }

    /**
     * ✅ لو حد بيعمل $user->password_hash = ...
     * نخزنها هاش برضو (بدون double hashing)
     */
    public function setPasswordHashAttribute($value): void
    {
        if ($value === null || $value === '') {
            return;
        }

        $hashed = $this->normalizePasswordValue((string) $value);
        $this->attributes['password_hash'] = $hashed;

        // مزامنة password لو موجود
        $this->attributes['password'] = $hashed;
    }

    private function normalizePasswordValue(string $value): string
    {
        // لو already hashed (bcrypt/argon) ما نعملش re-hash
        if (Str::startsWith($value, ['$2y$', '$argon2i$', '$argon2id$'])) {
            return $value;
        }
        return Hash::make($value);
    }

    protected static function boot()
    {
        parent::boot();

        static::created(function (self $user) {
            $user->user_code = self::makeUserCode($user);
            $user->saveQuietly();
        });

        static::updating(function (self $user) {
            $user->user_code = self::makeUserCode($user);
        });
    }

    private static function makeUserCode(self $user): string
    {
        $areaCode = $user->area?->code ?? '';

        // type عندك cast إلى Enum، لكن نخليها آمنة لأي حالة
        $roleEnum = $user->type instanceof UserRole
            ? $user->type
            : UserRole::tryFrom((string) $user->type);

        // لو معرفناش الدور لأي سبب: fallback
        $roleValue = $roleEnum?->value ?? (string) $user->type;

        // نفس منطقك للأدوار الأساسية
        if ($roleEnum === UserRole::USER) {
            return 'Usr_' . $areaCode . '_0' . $user->id;
        }

        if ($roleEnum === UserRole::DEALER) {
            return 'Dlr_' . $areaCode . '_0' . $user->id;
        }

        if ($roleEnum === UserRole::VENUE_OWNER) {
            return 'Csr_' . $areaCode . '_0' . $user->id;
        }

        if ($roleEnum === UserRole::INVESTOR) {
            return 'Inv_' . $areaCode . '_0' . $user->id;
        }

        // ✅ FIX: هنا كان ucfirst بياخد Enum object وده سبب crash
        // هنطلع abbreviation محترم لأي role (Admin/SuperAdmin/Moderator/Employee...)
        $abbr = Str::substr(Str::studly($roleValue), 0, 3); // e.g. SuperAdmin => Sup, Employee => Emp

        return $abbr . '_' . $areaCode . '_0' . $user->id;
    }

    // Relationships
    public function area()
    {
        return $this->belongsTo(Area::class);
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function bids()
    {
        return $this->hasMany(Bid::class);
    }

    public function wallet()
    {
        return $this->hasOne(Wallet::class);
    }

    public function dealer()
    {
        return $this->hasOne(Dealer::class);
    }

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

    public function hasVerifiedEmail()
    {
        return $this->email_verified_at !== null;
    }

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
        return $this->first_name . ' ' . $this->last_name;
    }
}

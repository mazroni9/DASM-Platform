<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    // Allow mass assignment for these fields.
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
        'is_active'
    ];

    // Casts for automatic type conversion
    protected $casts = [
        'is_active' => 'boolean',
        'email_verified_at' => 'datetime',
        'password_reset_expires_at' => 'datetime',
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
            'is_active' => true,
        ])->save();
    }
}

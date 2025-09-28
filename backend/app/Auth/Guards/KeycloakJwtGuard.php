<?php

namespace App\Auth\Guards;

use App\Services\KeycloakJwtService;
use App\Models\User;
use Illuminate\Auth\GuardHelpers;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Contracts\Auth\UserProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class KeycloakJwtGuard implements Guard
{
    use GuardHelpers;

    protected $request;
    protected $jwtService;

    public function __construct(UserProvider $provider, Request $request, KeycloakJwtService $jwtService)
    {
        $this->provider = $provider;
        $this->request = $request;
        $this->jwtService = $jwtService;
    }

    /**
     * Get the currently authenticated user.
     */
    public function user()
    {
        if (!is_null($this->user)) {
            return $this->user;
        }

        $token = $this->getTokenFromRequest();
        
        if (!$token) {
            return null;
        }

        $claims = $this->jwtService->validateToken($token);
        
        if (!$claims) {
            return null;
        }

        // Convert stdClass to array for consistency
        $claimsArray = (array) $claims;

        $this->user = $this->provider->retrieveByCredentials([
            'keycloak_uuid' => $this->jwtService->getUserId($claimsArray)
        ]);

        // If user not found in database, create a minimal user record
        if (!$this->user) {
            $this->user = $this->createUserFromClaims($claimsArray);
        } else {
            // Update user data from token if needed
            $this->updateUserFromClaims($this->user, $claimsArray);
        }

        return $this->user;
    }

    /**
     * Validate a user's credentials.
     */
    public function validate(array $credentials = [])
    {
        // This guard doesn't validate credentials directly
        // Authentication is handled by Keycloak
        return false;
    }

    /**
     * Set the current request instance.
     */
    public function setRequest(Request $request)
    {
        $this->request = $request;
        return $this;
    }

    /**
     * Get the token from the request
     */
    protected function getTokenFromRequest(): ?string
    {
        $token = $this->request->bearerToken();
        
        if (!$token) {
            $token = $this->request->header('Authorization');
            if ($token && str_starts_with($token, 'Bearer ')) {
                $token = substr($token, 7);
            }
        }
        
        return $token;
    }

    /**
     * Create a new user from JWT claims
     */
    protected function createUserFromClaims(array $claims): ?User
    {
        try {
            $keycloakRoles = $this->jwtService->extractRoles($claims);
            $appRole = $this->jwtService->mapRoles($keycloakRoles);
            $name = $this->jwtService->getName($claims);
            
            $user = User::create([
                'keycloak_uuid' => $this->jwtService->getUserId($claims),
                'email' => $this->jwtService->getEmail($claims),
                'first_name' => $name['first_name'],
                'last_name' => $name['last_name'],
                'role' => $appRole,
                'status' => 'active', // Assume active for Keycloak users
                'email_verified_at' => now(), // Assume verified for Keycloak users
                'is_active' => true,
                'phone' => '0000000000', // Dummy phone for Keycloak users
                'password_hash' => 'keycloak-user', // Dummy password hash for Keycloak users
            ]);

            return $user;
        } catch (\Exception $e) {
            Log::error('Failed to create user from Keycloak claims', [
                'error' => $e->getMessage(),
                'claims' => $claims
            ]);
            return null;
        }
    }

    /**
     * Update existing user from JWT claims
     */
    protected function updateUserFromClaims(?User $user, array $claims): void
    {
        if (!$user) {
            return;
        }

        try {
            $keycloakRoles = $this->jwtService->extractRoles($claims);
            $appRole = $this->jwtService->mapRoles($keycloakRoles);
            $name = $this->jwtService->getName($claims);
            
            $updateData = [
                'email' => $this->jwtService->getEmail($claims),
                'first_name' => $name['first_name'],
                'last_name' => $name['last_name'],
                'role' => $appRole,
            ];

            // Only update if data has changed
            $hasChanges = false;
            foreach ($updateData as $key => $value) {
                if ($user->$key !== $value) {
                    $hasChanges = true;
                    break;
                }
            }

            if ($hasChanges) {
                $user->update($updateData);
            }
        } catch (\Exception $e) {
            Log::error('Failed to update user from Keycloak claims', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
                'claims' => $claims
            ]);
        }
    }
}

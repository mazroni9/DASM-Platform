<?php

namespace App\Auth\Providers;

use App\Models\User;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Auth\UserProvider as UserProviderContract;
use Illuminate\Contracts\Hashing\Hasher as HasherContract;

class KeycloakUserProvider implements UserProviderContract
{
    protected $hasher;
    protected $model;

    public function __construct(HasherContract $hasher, $model)
    {
        $this->model = $model;
        $this->hasher = $hasher;
    }

    /**
     * Retrieve a user by their unique identifier.
     */
    public function retrieveById($identifier)
    {
        $model = $this->createModel();
        
        return $this->newModelQuery($model)
                    ->where($model->getAuthIdentifierName(), $identifier)
                    ->first();
    }

    /**
     * Retrieve a user by their unique identifier and "remember me" token.
     */
    public function retrieveByToken($identifier, $token)
    {
        // Not used in JWT authentication
        return null;
    }

    /**
     * Update the "remember me" token for the given user in storage.
     */
    public function updateRememberToken(Authenticatable $user, $token)
    {
        // Not used in JWT authentication
    }

    /**
     * Retrieve a user by the given credentials.
     */
    public function retrieveByCredentials(array $credentials)
    {
        if (empty($credentials)) {
            return null;
        }

        $model = $this->createModel();
        $query = $this->newModelQuery($model);

        // Handle Keycloak UUID lookup
        if (isset($credentials['keycloak_uuid'])) {
            return $query->where('keycloak_uuid', $credentials['keycloak_uuid'])->first();
        }

        // Handle email lookup (fallback)
        if (isset($credentials['email'])) {
            return $query->where('email', $credentials['email'])->first();
        }

        // Handle ID lookup
        if (isset($credentials['id'])) {
            return $query->where('id', $credentials['id'])->first();
        }

        return null;
    }

    /**
     * Validate a user against the given credentials.
     */
    public function validateCredentials(Authenticatable $user, array $credentials)
    {
        // For Keycloak authentication, we don't validate passwords locally
        // The JWT token validation is handled by the guard
        return true;
    }

    /**
     * Rehash the user's password if required and supported.
     */
    public function rehashPasswordIfRequired(Authenticatable $user, array $credentials, bool $force = false)
    {
        // For Keycloak authentication, we don't handle password rehashing
        // Passwords are managed by Keycloak
        return false;
    }

    /**
     * Create a new instance of the model.
     */
    public function createModel()
    {
        $class = '\\'.ltrim($this->model, '\\');

        return new $class;
    }

    /**
     * Get a new query builder for the model instance.
     */
    protected function newModelQuery($model = null)
    {
        return is_null($model)
                ? $this->createModel()->newQuery()
                : $model->newQuery();
    }
}

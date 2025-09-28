<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Keycloak Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for Keycloak integration
    |
    */

    'server_url' => env('KEYCLOAK_SERVER_URL', 'http://localhost:8080'),
    'realm' => env('KEYCLOAK_REALM', 'dasm-platform'),
    'client_id' => env('KEYCLOAK_CLIENT_ID', 'dasm-frontend'),
    'client_secret' => env('KEYCLOAK_CLIENT_SECRET', ''),
    
    // OIDC Discovery endpoint
    'discovery_url' => env('KEYCLOAK_SERVER_URL', 'http://localhost:8080') . '/realms/' . env('KEYCLOAK_REALM', 'dasm-platform'),
    
    // JWT Configuration
    'jwt' => [
        'algorithm' => 'RS256',
        'cache_ttl' => 3600, // Cache JWKS for 1 hour
    ],
    
    // Role mapping from Keycloak to application roles
    'role_mapping' => [
        'admin' => 'admin',
        'dealer' => 'dealer', 
        'moderator' => 'moderator',
        'venue_owner' => 'venue_owner',
        'investor' => 'investor',
        'user' => 'user',
    ],
    
    // Default role if no role is found in token
    'default_role' => 'user',
];

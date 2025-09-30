<?php

namespace App\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\JWK;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class KeycloakJwtService
{
    private $config;
    private $jwksUrl;

    public function __construct()
    {
        $this->config = config('keycloak');
        $this->jwksUrl = $this->config['discovery_url'] . '/protocol/openid-connect/certs';
    }

    /**
     * Validate JWT token from Keycloak
     */
    public function validateToken(string $token): ?array
    {
        try {
            // Decode token header to get key ID
            $header = JWT::jsonDecode(JWT::urlsafeB64Decode(explode('.', $token)[0]));
            
            if (!isset($header->kid)) {
                Log::error('Keycloak JWT: Missing key ID in token header');
                return null;
            }

            // Get JWKS (JSON Web Key Set)
            $jwks = $this->getJwks();
            if (!$jwks) {
                Log::error('Keycloak JWT: Failed to retrieve JWKS');
                return null;
            }

            // Find the correct key
            $key = null;
            foreach ($jwks['keys'] as $jwk) {
                if ($jwk['kid'] === $header->kid) {
                    $key = $jwk;
                    break;
                }
            }

            if (!$key) {
                Log::error('Keycloak JWT: Key not found in JWKS', ['kid' => $header->kid]);
                return null;
            }

            // Create key object for JWT validation
            try {
                $parsedKey = JWK::parseKey($key);
                // For newer versions of Firebase JWT, use the key directly
                $jwtKey = $parsedKey;

                // Decode and validate the token
                $payload = JWT::decode($token, $jwtKey);
            } catch (\Exception $e) {
                Log::error('Keycloak JWT: Failed to decode token', [
                    'error' => $e->getMessage(),
                    'key_id' => $header->kid,
                    'trace' => $e->getTraceAsString()
                ]);
                return null;
            }

            // Convert to array
            $claims = (array) $payload;

            // Validate token claims
            if (!$this->validateClaims($claims)) {
                return null;
            }

            return $claims;

        } catch (\Exception $e) {
            Log::error('Keycloak JWT validation failed', [
                'error' => $e->getMessage(),
                'token_preview' => substr($token, 0, 50) . '...'
            ]);
            return null;
        }
    }

    /**
     * Get JWKS from Keycloak with caching
     */
    private function getJwks(): ?array
    {
        $cacheKey = 'keycloak_jwks';
        
        return Cache::remember($cacheKey, $this->config['jwt']['cache_ttl'], function () {
            try {
                // Use the proper JWKS endpoint
                $jwksUrl = $this->config['server_url'] . '/realms/' . $this->config['realm'] . '/protocol/openid-connect/certs';
                
                $response = Http::timeout(10)->get($jwksUrl);
                
                if ($response->successful()) {
                    $jwks = $response->json();
                    Log::info('Keycloak JWT: Successfully fetched JWKS', [
                        'keys_count' => count($jwks['keys'] ?? [])
                    ]);
                    return $jwks;
                }
                
                Log::error('Keycloak JWT: Failed to fetch JWKS', [
                    'status' => $response->status(),
                    'url' => $jwksUrl
                ]);
                
                return null;
            } catch (\Exception $e) {
                Log::error('Keycloak JWT: Exception fetching JWKS', [
                    'error' => $e->getMessage(),
                    'url' => $jwksUrl
                ]);
                return null;
            }
        });
    }

    /**
     * Convert PEM public key to JWK format
     */
    private function convertPublicKeyToJwk(string $publicKey): array
    {
        // Remove PEM headers and decode
        $publicKey = str_replace(['-----BEGIN PUBLIC KEY-----', '-----END PUBLIC KEY-----', "\n", "\r"], '', $publicKey);
        
        // Parse the ASN.1 structure to extract RSA components
        $rsa = openssl_pkey_get_public("-----BEGIN PUBLIC KEY-----\n" . chunk_split($publicKey, 64, "\n") . "-----END PUBLIC KEY-----");
        $details = openssl_pkey_get_details($rsa);
        
        if (!$details || !isset($details['rsa'])) {
            throw new \Exception('Failed to parse RSA public key');
        }
        
        $rsa = $details['rsa'];
        
        // Generate a consistent key ID based on the public key
        $keyId = hash('sha256', $publicKey);
        $keyId = substr($keyId, 0, 16); // Use first 16 characters
        
        // Convert to JWK format
        return [
            'kty' => 'RSA',
            'use' => 'sig',
            'kid' => $keyId,
            'alg' => 'RS256',
            'n' => rtrim(strtr(base64_encode($rsa['n']), '+/', '-_'), '='),
            'e' => rtrim(strtr(base64_encode($rsa['e']), '+/', '-_'), '=')
        ];
    }

    /**
     * Validate JWT claims
     */
    private function validateClaims(array $claims): bool
    {
        $now = time();
        
        // Check expiration
        if (isset($claims['exp']) && $claims['exp'] < $now) {
            Log::warning('Keycloak JWT: Token expired');
            return false;
        }
        
        // Check not before
        if (isset($claims['nbf']) && $claims['nbf'] > $now) {
            Log::warning('Keycloak JWT: Token not yet valid');
            return false;
        }
        
        // Check issuer
        $expectedIssuer = $this->config['discovery_url'];
        if (isset($claims['iss']) && $claims['iss'] !== $expectedIssuer) {
            Log::warning('Keycloak JWT: Invalid issuer', [
                'expected' => $expectedIssuer,
                'actual' => $claims['iss']
            ]);
            return false;
        }
        
        // Check audience (client ID) - be flexible with realm suffix and account audience
        if (isset($claims['aud'])) {
            $audiences = (array)$claims['aud'];
            $expectedClientId = $this->config['client_id'];
            $expectedWithRealm = $expectedClientId . '-realm';
            
            // Accept tokens from the configured client, realm-suffixed client, or default 'account' audience
            $isValidAudience = in_array($expectedClientId, $audiences) || 
                              in_array($expectedWithRealm, $audiences) ||
                              in_array('account', $audiences);
            
            if (!$isValidAudience) {
                Log::warning('Keycloak JWT: Invalid audience', [
                    'expected' => [$expectedClientId, $expectedWithRealm, 'account'],
                    'actual' => $audiences
                ]);
                return false;
            }
        }
        
        return true;
    }

    /**
     * Extract user roles from token
     */
    public function extractRoles(array $claims): array
    {
        $roles = [];
        
        // Extract realm roles
        if (isset($claims['realm_access'])) {
            $realmAccess = $claims['realm_access'];
            if (is_object($realmAccess)) {
                $realmAccess = (array) $realmAccess;
            }
            if (isset($realmAccess['roles']) && is_array($realmAccess['roles'])) {
                $roles = array_merge($roles, $realmAccess['roles']);
            }
        }
        
        // Extract client roles
        if (isset($claims['resource_access'])) {
            $resourceAccess = $claims['resource_access'];
            if (is_object($resourceAccess)) {
                $resourceAccess = (array) $resourceAccess;
            }
            if (isset($resourceAccess[$this->config['client_id']])) {
                $clientAccess = $resourceAccess[$this->config['client_id']];
                if (is_object($clientAccess)) {
                    $clientAccess = (array) $clientAccess;
                }
                if (isset($clientAccess['roles']) && is_array($clientAccess['roles'])) {
                    $roles = array_merge($roles, $clientAccess['roles']);
                }
            }
        }
        
        return array_unique($roles);
    }

    /**
     * Map Keycloak roles to application roles
     */
    public function mapRoles(array $keycloakRoles): string
    {
        $roleMapping = $this->config['role_mapping'];
        
        // Check for exact matches first
        foreach ($keycloakRoles as $role) {
            if (isset($roleMapping[$role])) {
                return $roleMapping[$role];
            }
        }
        
        // Return default role if no match found
        return $this->config['default_role'];
    }

    /**
     * Get user ID from token (sub claim)
     */
    public function getUserId(array $claims): ?string
    {
        return $claims['sub'] ?? null;
    }

    /**
     * Get user email from token
     */
    public function getEmail(array $claims): ?string
    {
        // Try to get email from various possible fields
        $email = $claims['email'] ?? 
                 $claims['preferred_username'] ?? 
                 $claims['username'] ?? 
                 null;
        
        // If we have a username but no email, create a dummy email
        if (!$email && isset($claims['preferred_username'])) {
            $email = $claims['preferred_username'] . '@keycloak.local';
        }
        
        return $email;
    }

    /**
     * Get user name from token
     */
    public function getName(array $claims): array
    {
        return [
            'first_name' => $claims['given_name'] ?? '',
            'last_name' => $claims['family_name'] ?? '',
        ];
    }
}

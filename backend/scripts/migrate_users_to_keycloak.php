<?php

/**
 * User Migration Script: Database to Keycloak
 * 
 * This script migrates users from the local database to Keycloak
 * and updates the local database with Keycloak UUIDs.
 * 
 * Usage: php artisan migrate:users-to-keycloak [--dry-run] [--batch-size=50]
 */

require_once __DIR__ . '/../vendor/autoload.php';

use App\Models\User;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

class KeycloakUserMigrator
{
    private $keycloakBaseUrl;
    private $realm;
    private $clientId;
    private $clientSecret;
    private $adminToken;
    private $httpClient;
    private $dryRun;
    private $batchSize;
    private $migratedCount = 0;
    private $errorCount = 0;
    private $skippedCount = 0;

    public function __construct($dryRun = false, $batchSize = 50)
    {
        $this->dryRun = $dryRun;
        $this->batchSize = $batchSize;
        
        // Load Keycloak configuration
        $this->keycloakBaseUrl = config('keycloak.server_url', 'http://localhost:8080');
        $this->realm = config('keycloak.realm', 'dasm-platform');
        $this->clientId = config('keycloak.client_id', 'dasm-backend');
        $this->clientSecret = config('keycloak.client_secret', '');
        
        $this->httpClient = new Client([
            'base_uri' => $this->keycloakBaseUrl,
            'timeout' => 30,
            'headers' => [
                'Content-Type' => 'application/json',
                'Accept' => 'application/json'
            ]
        ]);

        $this->log("Starting user migration to Keycloak...");
        $this->log("Configuration: {$this->keycloakBaseUrl}/realms/{$this->realm}");
        $this->log("Dry run: " . ($dryRun ? 'YES' : 'NO'));
        $this->log("Batch size: {$batchSize}");
    }

    /**
     * Main migration method
     */
    public function migrate()
    {
        try {
            // Get admin token
            $this->getAdminToken();
            
            // Get all users from database
            $users = $this->getUsersToMigrate();
            $this->log("Found " . count($users) . " users to migrate");
            
            if (empty($users)) {
                $this->log("No users found to migrate");
                return;
            }
            
            // Process users in batches
            $batches = array_chunk($users, $this->batchSize);
            foreach ($batches as $batchIndex => $batch) {
                $this->log("Processing batch " . ($batchIndex + 1) . " of " . count($batches));
                $this->processBatch($batch);
            }
            
            $this->log("Migration completed!");
            $this->log("Migrated: {$this->migratedCount}");
            $this->log("Errors: {$this->errorCount}");
            $this->log("Skipped: {$this->skippedCount}");
            
        } catch (Exception $e) {
            $this->log("Migration failed: " . $e->getMessage(), 'error');
            throw $e;
        }
    }

    /**
     * Get admin token for Keycloak API
     */
    private function getAdminToken()
    {
        try {
            $response = $this->httpClient->post("/realms/{$this->realm}/protocol/openid-connect/token", [
                'form_params' => [
                    'grant_type' => 'client_credentials',
                    'client_id' => $this->clientId,
                    'client_secret' => $this->clientSecret,
                ]
            ]);

            $data = json_decode($response->getBody(), true);
            $this->adminToken = $data['access_token'];
            
            $this->log("Admin token obtained successfully");
            
        } catch (RequestException $e) {
            $this->log("Failed to get admin token: " . $e->getMessage(), 'error');
            throw new Exception("Cannot authenticate with Keycloak: " . $e->getMessage());
        }
    }

    /**
     * Get users that need to be migrated
     */
    private function getUsersToMigrate()
    {
        return User::whereNull('keycloak_uuid')
            ->where('email', '!=', '')
            ->whereNotNull('email')
            ->orderBy('id')
            ->get();
    }

    /**
     * Process a batch of users
     */
    private function processBatch($users)
    {
        foreach ($users as $user) {
            try {
                $this->migrateUser($user);
            } catch (Exception $e) {
                $this->log("Failed to migrate user {$user->email}: " . $e->getMessage(), 'error');
                $this->errorCount++;
            }
        }
    }

    /**
     * Migrate a single user to Keycloak
     */
    private function migrateUser(User $user)
    {
        $this->log("Migrating user: {$user->email} (ID: {$user->id})");

        // Check if user already exists in Keycloak
        $existingUser = $this->findUserInKeycloak($user->email);
        if ($existingUser) {
            $this->log("User {$user->email} already exists in Keycloak, updating local record");
            $this->updateLocalUserWithKeycloakUuid($user, $existingUser['id']);
            $this->skippedCount++;
            return;
        }

        if ($this->dryRun) {
            $this->log("DRY RUN: Would create user {$user->email} in Keycloak");
            $this->migratedCount++;
            return;
        }

        // Create user in Keycloak
        $keycloakUserData = $this->buildKeycloakUserData($user);
        $keycloakUserId = $this->createUserInKeycloak($keycloakUserData);
        
        // Update local user with Keycloak UUID
        $this->updateLocalUserWithKeycloakUuid($user, $keycloakUserId);
        
        // Set password if available
        if ($user->password_hash && $user->password_hash !== 'keycloak-user') {
            $this->setUserPassword($keycloakUserId, $user->password_hash);
        }
        
        // Assign roles
        $this->assignUserRoles($keycloakUserId, $user->role);
        
        $this->migratedCount++;
        $this->log("Successfully migrated user {$user->email}");
    }

    /**
     * Find user in Keycloak by email
     */
    private function findUserInKeycloak($email)
    {
        try {
            $response = $this->httpClient->get("/admin/realms/{$this->realm}/users", [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->adminToken
                ],
                'query' => [
                    'email' => $email,
                    'exact' => 'true'
                ]
            ]);

            $users = json_decode($response->getBody(), true);
            return !empty($users) ? $users[0] : null;
            
        } catch (RequestException $e) {
            $this->log("Error searching for user {$email}: " . $e->getMessage(), 'error');
            return null;
        }
    }

    /**
     * Build user data for Keycloak
     */
    private function buildKeycloakUserData(User $user)
    {
        $userData = [
            'username' => $user->email,
            'email' => $user->email,
            'firstName' => $user->first_name ?? '',
            'lastName' => $user->last_name ?? '',
            'enabled' => $user->is_active ?? true,
            'emailVerified' => $user->email_verified_at ? true : false,
            'attributes' => [
                'phone' => [$user->phone ?? ''],
                'kyc_status' => [$user->kyc_status ?? ''],
                'original_user_id' => [(string)$user->id],
                'migrated_at' => [now()->toISOString()],
            ]
        ];

        // Add phone if available
        if ($user->phone) {
            $userData['attributes']['phone'] = [$user->phone];
        }

        return $userData;
    }

    /**
     * Create user in Keycloak
     */
    private function createUserInKeycloak($userData)
    {
        try {
            $response = $this->httpClient->post("/admin/realms/{$this->realm}/users", [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->adminToken
                ],
                'json' => $userData
            ]);

            // Get the user ID from the Location header
            $location = $response->getHeader('Location')[0] ?? '';
            $userId = basename($location);
            
            if (!$userId) {
                throw new Exception("Could not extract user ID from response");
            }

            return $userId;
            
        } catch (RequestException $e) {
            $errorBody = $e->getResponse() ? $e->getResponse()->getBody()->getContents() : '';
            throw new Exception("Failed to create user in Keycloak: " . $errorBody);
        }
    }

    /**
     * Update local user with Keycloak UUID
     */
    private function updateLocalUserWithKeycloakUuid(User $user, $keycloakUserId)
    {
        if (!$this->dryRun) {
            $user->update(['keycloak_uuid' => $keycloakUserId]);
            $this->log("Updated local user {$user->email} with Keycloak UUID: {$keycloakUserId}");
        }
    }

    /**
     * Set user password in Keycloak
     */
    private function setUserPassword($keycloakUserId, $passwordHash)
    {
        try {
            // For now, we'll set a temporary password and require user to change it
            $temporaryPassword = 'TempPassword123!';
            
            $this->httpClient->put("/admin/realms/{$this->realm}/users/{$keycloakUserId}/reset-password", [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->adminToken
                ],
                'json' => [
                    'type' => 'password',
                    'value' => $temporaryPassword,
                    'temporary' => true
                ]
            ]);
            
            $this->log("Set temporary password for user {$keycloakUserId}");
            
        } catch (RequestException $e) {
            $this->log("Failed to set password for user {$keycloakUserId}: " . $e->getMessage(), 'error');
        }
    }

    /**
     * Assign roles to user in Keycloak
     */
    private function assignUserRoles($keycloakUserId, UserRole $role)
    {
        try {
            // Map application roles to Keycloak client roles
            $roleMapping = [
                'admin' => 'admin',
                'moderator' => 'moderator',
                'venue_owner' => 'venue_owner',
                'investor' => 'investor',
                'dealer' => 'dealer',
                'user' => 'user',
            ];

            $keycloakRole = $roleMapping[$role->value] ?? 'user';
            
            // Get the client role
            $clientRole = $this->getClientRole($keycloakRole);
            if (!$clientRole) {
                $this->log("Role {$keycloakRole} not found in Keycloak", 'warning');
                return;
            }

            // Assign the role
            $this->httpClient->post("/admin/realms/{$this->realm}/users/{$keycloakUserId}/role-mappings/clients/{$clientRole['containerId']}", [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->adminToken
                ],
                'json' => [$clientRole]
            ]);
            
            $this->log("Assigned role {$keycloakRole} to user {$keycloakUserId}");
            
        } catch (RequestException $e) {
            $this->log("Failed to assign role to user {$keycloakUserId}: " . $e->getMessage(), 'error');
        }
    }

    /**
     * Get client role from Keycloak
     */
    private function getClientRole($roleName)
    {
        try {
            // First, get the client
            $clientResponse = $this->httpClient->get("/admin/realms/{$this->realm}/clients", [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->adminToken
                ],
                'query' => [
                    'clientId' => $this->clientId
                ]
            ]);

            $clients = json_decode($clientResponse->getBody(), true);
            if (empty($clients)) {
                return null;
            }

            $clientId = $clients[0]['id'];

            // Get the role
            $roleResponse = $this->httpClient->get("/admin/realms/{$this->realm}/clients/{$clientId}/roles/{$roleName}", [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->adminToken
                ]
            ]);

            $role = json_decode($roleResponse->getBody(), true);
            $role['containerId'] = $clientId;
            
            return $role;
            
        } catch (RequestException $e) {
            return null;
        }
    }

    /**
     * Log message
     */
    private function log($message, $level = 'info')
    {
        $timestamp = now()->format('Y-m-d H:i:s');
        $logMessage = "[{$timestamp}] {$message}";
        
        echo $logMessage . PHP_EOL;
        
        if ($level === 'error') {
            Log::error($message);
        } elseif ($level === 'warning') {
            Log::warning($message);
        } else {
            Log::info($message);
        }
    }
}

// Command line interface
if (php_sapi_name() === 'cli') {
    $options = getopt('', ['dry-run', 'batch-size:']);
    
    $dryRun = isset($options['dry-run']);
    $batchSize = isset($options['batch-size']) ? (int)$options['batch-size'] : 50;
    
    try {
        $migrator = new KeycloakUserMigrator($dryRun, $batchSize);
        $migrator->migrate();
    } catch (Exception $e) {
        echo "Migration failed: " . $e->getMessage() . PHP_EOL;
        exit(1);
    }
}

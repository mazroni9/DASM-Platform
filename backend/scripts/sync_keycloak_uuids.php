<?php

/**
 * Sync Keycloak UUIDs to Database
 * 
 * This script fetches users from Keycloak and updates the local database
 * with their Keycloak UUIDs based on email matching.
 * 
 * Usage: php artisan sync:keycloak-uuids [--dry-run]
 */

require_once __DIR__ . '/../vendor/autoload.php';

use App\Models\User;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

class KeycloakUuidSyncer
{
    private $keycloakBaseUrl;
    private $realm;
    private $clientId;
    private $clientSecret;
    private $adminToken;
    private $httpClient;
    private $dryRun;
    private $syncedCount = 0;
    private $errorCount = 0;
    private $notFoundCount = 0;

    public function __construct($dryRun = false)
    {
        $this->dryRun = $dryRun;
        
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

        $this->log("Starting Keycloak UUID sync...");
        $this->log("Configuration: {$this->keycloakBaseUrl}/realms/{$this->realm}");
        $this->log("Dry run: " . ($dryRun ? 'YES' : 'NO'));
    }

    /**
     * Main sync method
     */
    public function sync()
    {
        try {
            // Get admin token
            $this->getAdminToken();
            
            // Get all users from database that don't have keycloak_uuid
            $users = User::whereNull('keycloak_uuid')
                ->where('email', '!=', '')
                ->whereNotNull('email')
                ->get();
            
            $this->log("Found " . count($users) . " users without Keycloak UUID");
            
            if (empty($users)) {
                $this->log("No users need UUID sync");
                return;
            }
            
            // Process each user
            foreach ($users as $user) {
                $this->syncUserUuid($user);
            }
            
            $this->log("Sync completed!");
            $this->log("Synced: {$this->syncedCount}");
            $this->log("Errors: {$this->errorCount}");
            $this->log("Not found in Keycloak: {$this->notFoundCount}");
            
        } catch (Exception $e) {
            $this->log("Sync failed: " . $e->getMessage(), 'error');
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
            throw new Exception("Cannot authenticate with Keycloak: " . $e->getMessage());
        }
    }

    /**
     * Sync UUID for a single user
     */
    private function syncUserUuid(User $user)
    {
        $this->log("Syncing user: {$user->email} (ID: {$user->id})");

        try {
            // Find user in Keycloak by email
            $keycloakUser = $this->findUserInKeycloak($user->email);
            
            if (!$keycloakUser) {
                $this->log("User {$user->email} not found in Keycloak", 'warning');
                $this->notFoundCount++;
                return;
            }

            $keycloakUuid = $keycloakUser['id'];
            
            if ($this->dryRun) {
                $this->log("DRY RUN: Would update user {$user->email} with UUID: {$keycloakUuid}");
            } else {
                // Update local user with Keycloak UUID
                $user->update(['keycloak_uuid' => $keycloakUuid]);
                $this->log("Updated user {$user->email} with UUID: {$keycloakUuid}");
            }
            
            $this->syncedCount++;
            
        } catch (Exception $e) {
            $this->log("Failed to sync user {$user->email}: " . $e->getMessage(), 'error');
            $this->errorCount++;
        }
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
    $options = getopt('', ['dry-run']);
    $dryRun = isset($options['dry-run']);
    
    try {
        $syncer = new KeycloakUuidSyncer($dryRun);
        $syncer->sync();
    } catch (Exception $e) {
        echo "Sync failed: " . $e->getMessage() . PHP_EOL;
        exit(1);
    }
}

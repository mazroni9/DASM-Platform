<?php

/**
 * Migration Verification Script
 * 
 * This script verifies that the user migration to Keycloak was successful
 * by checking both the database and Keycloak.
 * 
 * Usage: php artisan verify:migration
 */

require_once __DIR__ . '/../vendor/autoload.php';

use App\Models\User;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

class MigrationVerifier
{
    private $keycloakBaseUrl;
    private $realm;
    private $clientId;
    private $clientSecret;
    private $adminToken;
    private $httpClient;

    public function __construct()
    {
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

        $this->log("Verifying user migration to Keycloak...");
    }

    /**
     * Main verification method
     */
    public function verify()
    {
        try {
            // Get admin token
            $this->getAdminToken();
            
            // Get statistics
            $stats = $this->getMigrationStats();
            $this->displayStats($stats);
            
            // Verify sample users
            $this->verifySampleUsers();
            
            // Check role assignments
            $this->verifyRoleAssignments();
            
            $this->log("Verification completed successfully!");
            
        } catch (Exception $e) {
            $this->log("Verification failed: " . $e->getMessage(), 'error');
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
     * Get migration statistics
     */
    private function getMigrationStats()
    {
        $totalUsers = User::count();
        $migratedUsers = User::whereNotNull('keycloak_uuid')->count();
        $unmigratedUsers = User::whereNull('keycloak_uuid')->count();
        
        // Get Keycloak user count
        $keycloakUsers = $this->getKeycloakUserCount();
        
        return [
            'total_users' => $totalUsers,
            'migrated_users' => $migratedUsers,
            'unmigrated_users' => $unmigratedUsers,
            'keycloak_users' => $keycloakUsers,
            'migration_percentage' => $totalUsers > 0 ? round(($migratedUsers / $totalUsers) * 100, 2) : 0
        ];
    }

    /**
     * Get Keycloak user count
     */
    private function getKeycloakUserCount()
    {
        try {
            $response = $this->httpClient->get("/admin/realms/{$this->realm}/users/count", [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->adminToken
                ]
            ]);

            return (int) $response->getBody()->getContents();
            
        } catch (RequestException $e) {
            $this->log("Could not get Keycloak user count: " . $e->getMessage(), 'warning');
            return 0;
        }
    }

    /**
     * Display migration statistics
     */
    private function displayStats($stats)
    {
        $this->log("=== Migration Statistics ===");
        $this->log("Total users in database: {$stats['total_users']}");
        $this->log("Migrated users: {$stats['migrated_users']}");
        $this->log("Unmigrated users: {$stats['unmigrated_users']}");
        $this->log("Users in Keycloak: {$stats['keycloak_users']}");
        $this->log("Migration percentage: {$stats['migration_percentage']}%");
        
        if ($stats['unmigrated_users'] > 0) {
            $this->log("⚠️  Warning: {$stats['unmigrated_users']} users still need to be migrated", 'warning');
        }
        
        if ($stats['migrated_users'] !== $stats['keycloak_users']) {
            $this->log("⚠️  Warning: User count mismatch between database and Keycloak", 'warning');
        }
    }

    /**
     * Verify sample users
     */
    private function verifySampleUsers()
    {
        $this->log("\n=== Verifying Sample Users ===");
        
        $sampleUsers = User::whereNotNull('keycloak_uuid')
            ->limit(5)
            ->get();
        
        foreach ($sampleUsers as $user) {
            $this->verifyUser($user);
        }
    }

    /**
     * Verify a single user
     */
    private function verifyUser(User $user)
    {
        try {
            $response = $this->httpClient->get("/admin/realms/{$this->realm}/users/{$user->keycloak_uuid}", [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->adminToken
                ]
            ]);

            $keycloakUser = json_decode($response->getBody(), true);
            
            // Verify basic information
            $emailMatch = $keycloakUser['email'] === $user->email;
            $firstNameMatch = $keycloakUser['firstName'] === ($user->first_name ?? '');
            $lastNameMatch = $keycloakUser['lastName'] === ($user->last_name ?? '');
            $enabledMatch = $keycloakUser['enabled'] === ($user->is_active ?? true);
            
            $status = $emailMatch && $firstNameMatch && $lastNameMatch && $enabledMatch ? '✅' : '❌';
            
            $this->log("{$status} User: {$user->email}");
            $this->log("   Database UUID: {$user->keycloak_uuid}");
            $this->log("   Keycloak ID: {$keycloakUser['id']}");
            $this->log("   Email match: " . ($emailMatch ? 'Yes' : 'No'));
            $this->log("   Name match: " . ($firstNameMatch && $lastNameMatch ? 'Yes' : 'No'));
            $this->log("   Enabled match: " . ($enabledMatch ? 'Yes' : 'No'));
            
        } catch (RequestException $e) {
            $this->log("❌ User: {$user->email} - Could not verify: " . $e->getMessage(), 'error');
        }
    }

    /**
     * Verify role assignments
     */
    private function verifyRoleAssignments()
    {
        $this->log("\n=== Verifying Role Assignments ===");
        
        $roleStats = [];
        $users = User::whereNotNull('keycloak_uuid')->get();
        
        foreach ($users as $user) {
            $role = $user->role->value;
            $roleStats[$role] = ($roleStats[$role] ?? 0) + 1;
        }
        
        foreach ($roleStats as $role => $count) {
            $this->log("Role '{$role}': {$count} users");
        }
        
        // Check if roles exist in Keycloak
        $this->checkKeycloakRoles();
    }

    /**
     * Check if roles exist in Keycloak
     */
    private function checkKeycloakRoles()
    {
        try {
            // Get client
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
                $this->log("❌ Client {$this->clientId} not found in Keycloak", 'error');
                return;
            }

            $clientId = $clients[0]['id'];

            // Get client roles
            $rolesResponse = $this->httpClient->get("/admin/realms/{$this->realm}/clients/{$clientId}/roles", [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->adminToken
                ]
            ]);

            $roles = json_decode($rolesResponse->getBody(), true);
            $roleNames = array_column($roles, 'name');
            
            $this->log("\nKeycloak client roles:");
            foreach ($roleNames as $roleName) {
                $this->log("  ✅ {$roleName}");
            }
            
        } catch (RequestException $e) {
            $this->log("❌ Could not verify Keycloak roles: " . $e->getMessage(), 'error');
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
    }
}

// Command line interface
if (php_sapi_name() === 'cli') {
    try {
        $verifier = new MigrationVerifier();
        $verifier->verify();
    } catch (Exception $e) {
        echo "Verification failed: " . $e->getMessage() . PHP_EOL;
        exit(1);
    }
}

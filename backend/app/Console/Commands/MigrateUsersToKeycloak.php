<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Enums\UserRole;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use Illuminate\Support\Facades\Log;

class MigrateUsersToKeycloak extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'migrate:users-to-keycloak 
                            {--dry-run : Run in dry-run mode without making actual changes}
                            {--batch-size=50 : Number of users to process in each batch}
                            {--force : Skip confirmation prompt}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate users from local database to Keycloak';

    private $keycloakBaseUrl;
    private $realm;
    private $clientId;
    private $clientSecret;
    private $adminToken;
    private $httpClient;
    private $migratedCount = 0;
    private $errorCount = 0;
    private $skippedCount = 0;

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');
        $batchSize = (int) $this->option('batch-size');
        $force = $this->option('force');

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

        $this->info('Starting user migration to Keycloak...');
        $this->info("Configuration: {$this->keycloakBaseUrl}/realms/{$this->realm}");
        $this->info("Dry run: " . ($dryRun ? 'YES' : 'NO'));
        $this->info("Batch size: {$batchSize}");

        // Show statistics
        $totalUsers = User::count();
        $usersToMigrate = User::whereNull('keycloak_uuid')->count();
        $alreadyMigrated = User::whereNotNull('keycloak_uuid')->count();

        $this->table(
            ['Metric', 'Count'],
            [
                ['Total Users', $totalUsers],
                ['Users to Migrate', $usersToMigrate],
                ['Already Migrated', $alreadyMigrated],
            ]
        );

        if ($usersToMigrate === 0) {
            $this->info('No users need to be migrated.');
            return 0;
        }

        // Confirmation
        if (!$force && !$dryRun) {
            if (!$this->confirm("Do you want to proceed with migrating {$usersToMigrate} users to Keycloak?")) {
                $this->info('Migration cancelled.');
                return 0;
            }
        }

        try {
            // Get admin token
            $this->getAdminToken();
            
            // Get users to migrate
            $users = $this->getUsersToMigrate();
            $this->info("Found " . count($users) . " users to migrate");
            
            // Process users in batches
            $batches = $users->chunk($batchSize);
            $progressBar = $this->output->createProgressBar($users->count());
            $progressBar->start();

            foreach ($batches as $batch) {
                $this->processBatch($batch, $dryRun);
                $progressBar->advance($batch->count());
            }

            $progressBar->finish();
            $this->newLine(2);

            // Show results
            $this->info('Migration completed!');
            $this->table(
                ['Result', 'Count'],
                [
                    ['Migrated', $this->migratedCount],
                    ['Errors', $this->errorCount],
                    ['Skipped', $this->skippedCount],
                ]
            );

            if ($this->errorCount > 0) {
                $this->warn("There were {$this->errorCount} errors during migration. Check the logs for details.");
            }

            return 0;
            
        } catch (\Exception $e) {
            $this->error("Migration failed: " . $e->getMessage());
            Log::error('Keycloak migration failed', ['error' => $e->getMessage()]);
            return 1;
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
            
            $this->info('Admin token obtained successfully');
            
        } catch (RequestException $e) {
            throw new \Exception("Cannot authenticate with Keycloak: " . $e->getMessage());
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
    private function processBatch($users, $dryRun)
    {
        foreach ($users as $user) {
            try {
                $this->migrateUser($user, $dryRun);
            } catch (\Exception $e) {
                $this->error("Failed to migrate user {$user->email}: " . $e->getMessage());
                $this->errorCount++;
            }
        }
    }

    /**
     * Migrate a single user to Keycloak
     */
    private function migrateUser(User $user, $dryRun)
    {
        // Check if user already exists in Keycloak
        $existingUser = $this->findUserInKeycloak($user->email);
        if ($existingUser) {
            $this->updateLocalUserWithKeycloakUuid($user, $existingUser['id'], $dryRun);
            $this->skippedCount++;
            return;
        }

        if ($dryRun) {
            $this->migratedCount++;
            return;
        }

        // Create user in Keycloak
        $keycloakUserData = $this->buildKeycloakUserData($user);
        $keycloakUserId = $this->createUserInKeycloak($keycloakUserData);
        
        // Update local user with Keycloak UUID
        $this->updateLocalUserWithKeycloakUuid($user, $keycloakUserId, $dryRun);
        
        // Set password if available
        if ($user->password_hash && $user->password_hash !== 'keycloak-user') {
            $this->setUserPassword($keycloakUserId, $user->password_hash);
        }
        
        // Assign roles
        $this->assignUserRoles($keycloakUserId, $user->role);
        
        $this->migratedCount++;
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
                throw new \Exception("Could not extract user ID from response");
            }

            return $userId;
            
        } catch (RequestException $e) {
            $errorBody = $e->getResponse() ? $e->getResponse()->getBody()->getContents() : '';
            throw new \Exception("Failed to create user in Keycloak: " . $errorBody);
        }
    }

    /**
     * Update local user with Keycloak UUID
     */
    private function updateLocalUserWithKeycloakUuid(User $user, $keycloakUserId, $dryRun)
    {
        if (!$dryRun) {
            $user->update(['keycloak_uuid' => $keycloakUserId]);
        }
    }

    /**
     * Set user password in Keycloak
     */
    private function setUserPassword($keycloakUserId, $passwordHash)
    {
        try {
            // Set a temporary password that user must change on first login
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
            
        } catch (RequestException $e) {
            // Log error but don't fail the migration
            Log::warning("Failed to set password for user {$keycloakUserId}: " . $e->getMessage());
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
                Log::warning("Role {$keycloakRole} not found in Keycloak");
                return;
            }

            // Assign the role
            $this->httpClient->post("/admin/realms/{$this->realm}/users/{$keycloakUserId}/role-mappings/clients/{$clientRole['containerId']}", [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->adminToken
                ],
                'json' => [$clientRole]
            ]);
            
        } catch (RequestException $e) {
            Log::warning("Failed to assign role to user {$keycloakUserId}: " . $e->getMessage());
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
}

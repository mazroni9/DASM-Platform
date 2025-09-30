<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

class SyncKeycloakUuids extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sync:keycloak-uuids 
                            {--dry-run : Run in dry-run mode without making actual changes}
                            {--force : Skip confirmation prompt}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync Keycloak UUIDs to local database for existing users';

    private $keycloakBaseUrl;
    private $realm;
    private $clientId;
    private $clientSecret;
    private $adminToken;
    private $httpClient;
    private $syncedCount = 0;
    private $errorCount = 0;
    private $notFoundCount = 0;

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');
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

        $this->info('Starting Keycloak UUID sync...');
        $this->info("Configuration: {$this->keycloakBaseUrl}/realms/{$this->realm}");
        $this->info("Dry run: " . ($dryRun ? 'YES' : 'NO'));

        // Show statistics
        $totalUsers = User::count();
        $usersWithoutUuid = User::whereNull('keycloak_uuid')->count();
        $usersWithUuid = User::whereNotNull('keycloak_uuid')->count();

        $this->table(
            ['Metric', 'Count'],
            [
                ['Total Users', $totalUsers],
                ['Users without Keycloak UUID', $usersWithoutUuid],
                ['Users with Keycloak UUID', $usersWithUuid],
            ]
        );

        if ($usersWithoutUuid === 0) {
            $this->info('All users already have Keycloak UUIDs.');
            return 0;
        }

        // Confirmation
        if (!$force && !$dryRun) {
            if (!$this->confirm("Do you want to proceed with syncing {$usersWithoutUuid} users?")) {
                $this->info('Sync cancelled.');
                return 0;
            }
        }

        try {
            // Get admin token
            $this->getAdminToken();
            
            // Get users to sync
            $users = User::whereNull('keycloak_uuid')
                ->where('email', '!=', '')
                ->whereNotNull('email')
                ->get();
            
            $this->info("Found " . count($users) . " users to sync");
            
            // Process users
            $progressBar = $this->output->createProgressBar($users->count());
            $progressBar->start();

            foreach ($users as $user) {
                $this->syncUserUuid($user, $dryRun);
                $progressBar->advance();
            }

            $progressBar->finish();
            $this->newLine(2);

            // Show results
            $this->info('Sync completed!');
            $this->table(
                ['Result', 'Count'],
                [
                    ['Synced', $this->syncedCount],
                    ['Errors', $this->errorCount],
                    ['Not Found in Keycloak', $this->notFoundCount],
                ]
            );

            if ($this->errorCount > 0) {
                $this->warn("There were {$this->errorCount} errors during sync. Check the logs for details.");
            }

            if ($this->notFoundCount > 0) {
                $this->warn("{$this->notFoundCount} users were not found in Keycloak. They may need to be created first.");
            }

            return 0;
            
        } catch (\Exception $e) {
            $this->error("Sync failed: " . $e->getMessage());
            Log::error('Keycloak UUID sync failed', ['error' => $e->getMessage()]);
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
     * Sync UUID for a single user
     */
    private function syncUserUuid(User $user, $dryRun)
    {
        try {
            // Find user in Keycloak by email
            $keycloakUser = $this->findUserInKeycloak($user->email);
            
            if (!$keycloakUser) {
                $this->notFoundCount++;
                return;
            }

            $keycloakUuid = $keycloakUser['id'];
            
            if (!$dryRun) {
                // Update local user with Keycloak UUID
                $user->update(['keycloak_uuid' => $keycloakUuid]);
            }
            
            $this->syncedCount++;
            
        } catch (\Exception $e) {
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
            return null;
        }
    }
}

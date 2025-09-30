<?php

/**
 * Keycloak Setup Script for User Migration
 * 
 * This script prepares Keycloak for user migration by:
 * 1. Creating necessary client roles
 * 2. Setting up role mappings
 * 3. Configuring client settings
 * 
 * Usage: php artisan setup:keycloak-for-migration
 */

require_once __DIR__ . '/../../vendor/autoload.php';

use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

class KeycloakSetup
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

        $this->log("Setting up Keycloak for user migration...");
        $this->log("Configuration: {$this->keycloakBaseUrl}/realms/{$this->realm}");
    }

    /**
     * Main setup method
     */
    public function setup()
    {
        try {
            // Get admin token
            $this->getAdminToken();
            
            // Get or create client
            $client = $this->getOrCreateClient();
            
            // Create roles
            $this->createClientRoles($client['id']);
            
            // Configure client settings
            $this->configureClient($client['id']);
            
            $this->log("Keycloak setup completed successfully!");
            
        } catch (Exception $e) {
            $this->log("Setup failed: " . $e->getMessage(), 'error');
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
     * Get or create the client
     */
    private function getOrCreateClient()
    {
        try {
            // Try to get existing client
            $response = $this->httpClient->get("/admin/realms/{$this->realm}/clients", [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->adminToken
                ],
                'query' => [
                    'clientId' => $this->clientId
                ]
            ]);

            $clients = json_decode($response->getBody(), true);
            
            if (!empty($clients)) {
                $this->log("Client {$this->clientId} already exists");
                return $clients[0];
            }

            // Create new client
            $this->log("Creating new client: {$this->clientId}");
            $clientData = [
                'clientId' => $this->clientId,
                'name' => 'DASM Backend Client',
                'description' => 'Backend client for DASM platform user migration',
                'enabled' => true,
                'clientAuthenticatorType' => 'client-secret',
                'secret' => $this->clientSecret,
                'serviceAccountsEnabled' => true,
                'authorizationServicesEnabled' => false,
                'directAccessGrantsEnabled' => true,
                'standardFlowEnabled' => true,
                'implicitFlowEnabled' => false,
                'publicClient' => false,
                'protocol' => 'openid-connect',
                'attributes' => [
                    'access.token.lifespan' => '3600',
                    'client.secret.creation.time' => (string)time(),
                ]
            ];

            $response = $this->httpClient->post("/admin/realms/{$this->realm}/clients", [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->adminToken
                ],
                'json' => $clientData
            ]);

            // Get the created client
            $response = $this->httpClient->get("/admin/realms/{$this->realm}/clients", [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->adminToken
                ],
                'query' => [
                    'clientId' => $this->clientId
                ]
            ]);

            $clients = json_decode($response->getBody(), true);
            return $clients[0];
            
        } catch (RequestException $e) {
            throw new Exception("Failed to get or create client: " . $e->getMessage());
        }
    }

    /**
     * Create client roles
     */
    private function createClientRoles($clientId)
    {
        $roles = [
            'admin' => 'Administrator role with full system access',
            'moderator' => 'Moderator role for auction management',
            'venue_owner' => 'Venue owner role for venue management',
            'investor' => 'Investor role for investment features',
            'dealer' => 'Dealer role for car trading',
            'user' => 'Basic user role',
        ];

        foreach ($roles as $roleName => $description) {
            $this->createClientRole($clientId, $roleName, $description);
        }
    }

    /**
     * Create a single client role
     */
    private function createClientRole($clientId, $roleName, $description)
    {
        try {
            // Check if role already exists
            $response = $this->httpClient->get("/admin/realms/{$this->realm}/clients/{$clientId}/roles/{$roleName}", [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->adminToken
                ]
            ]);

            $this->log("Role {$roleName} already exists");
            return;
            
        } catch (RequestException $e) {
            if ($e->getResponse() && $e->getResponse()->getStatusCode() === 404) {
                // Role doesn't exist, create it
                try {
                    $roleData = [
                        'name' => $roleName,
                        'description' => $description,
                        'composite' => false,
                        'clientRole' => true,
                    ];

                    $this->httpClient->post("/admin/realms/{$this->realm}/clients/{$clientId}/roles", [
                        'headers' => [
                            'Authorization' => 'Bearer ' . $this->adminToken
                        ],
                        'json' => $roleData
                    ]);

                    $this->log("Created role: {$roleName}");
                    
                } catch (RequestException $createError) {
                    $this->log("Failed to create role {$roleName}: " . $createError->getMessage(), 'error');
                }
            } else {
                $this->log("Error checking role {$roleName}: " . $e->getMessage(), 'error');
            }
        }
    }

    /**
     * Configure client settings
     */
    private function configureClient($clientId)
    {
        try {
            $clientData = [
                'serviceAccountsEnabled' => true,
                'directAccessGrantsEnabled' => true,
                'standardFlowEnabled' => true,
                'implicitFlowEnabled' => false,
                'publicClient' => false,
                'protocol' => 'openid-connect',
                'attributes' => [
                    'access.token.lifespan' => '3600',
                    'client.session.idle.timeout' => '1800',
                    'client.session.max.lifespan' => '36000',
                ]
            ];

            $this->httpClient->put("/admin/realms/{$this->realm}/clients/{$clientId}", [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->adminToken
                ],
                'json' => $clientData
            ]);

            $this->log("Client configuration updated");
            
        } catch (RequestException $e) {
            $this->log("Failed to configure client: " . $e->getMessage(), 'error');
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
        $setup = new KeycloakSetup();
        $setup->setup();
    } catch (Exception $e) {
        echo "Setup failed: " . $e->getMessage() . PHP_EOL;
        exit(1);
    }
}

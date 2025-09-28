<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class KeycloakAuthTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test Keycloak token validation endpoint
     */
    public function test_validate_keycloak_token_without_token()
    {
        $response = $this->postJson('/api/validate-keycloak-token');

        $response->assertStatus(401)
                ->assertJson([
                    'status' => 'error',
                    'message' => 'Invalid or expired token'
                ]);
    }

    /**
     * Test Keycloak token validation with invalid token
     */
    public function test_validate_keycloak_token_with_invalid_token()
    {
        $response = $this->postJson('/api/validate-keycloak-token', [], [
            'Authorization' => 'Bearer invalid-token'
        ]);

        $response->assertStatus(401)
                ->assertJson([
                    'status' => 'error',
                    'message' => 'Invalid or expired token'
                ]);
    }

    /**
     * Test user creation with Keycloak UUID
     */
    public function test_user_creation_with_keycloak_uuid()
    {
        $user = User::create([
            'keycloak_uuid' => 'test-keycloak-uuid-123',
            'email' => 'test@example.com',
            'first_name' => 'Test',
            'last_name' => 'User',
            'phone' => '1234567890',
            'password_hash' => 'dummy-hash-for-keycloak-user',
            'role' => 'user',
            'status' => 'active',
            'email_verified_at' => now(),
            'is_active' => true,
        ]);

        $this->assertDatabaseHas('users', [
            'keycloak_uuid' => 'test-keycloak-uuid-123',
            'email' => 'test@example.com'
        ]);

        $this->assertEquals('test-keycloak-uuid-123', $user->keycloak_uuid);
    }

    /**
     * Test Keycloak configuration
     */
    public function test_keycloak_configuration()
    {
        $config = config('keycloak');
        
        $this->assertArrayHasKey('server_url', $config);
        $this->assertArrayHasKey('realm', $config);
        $this->assertArrayHasKey('client_id', $config);
        $this->assertArrayHasKey('role_mapping', $config);
    }

    /**
     * Test role mapping configuration
     */
    public function test_role_mapping_configuration()
    {
        $roleMapping = config('keycloak.role_mapping');
        
        $this->assertArrayHasKey('admin', $roleMapping);
        $this->assertArrayHasKey('dealer', $roleMapping);
        $this->assertArrayHasKey('moderator', $roleMapping);
        $this->assertArrayHasKey('venue_owner', $roleMapping);
        $this->assertArrayHasKey('investor', $roleMapping);
        $this->assertArrayHasKey('user', $roleMapping);
        
        $this->assertEquals('admin', $roleMapping['admin']);
        $this->assertEquals('dealer', $roleMapping['dealer']);
        $this->assertEquals('moderator', $roleMapping['moderator']);
        $this->assertEquals('venue_owner', $roleMapping['venue_owner']);
        $this->assertEquals('investor', $roleMapping['investor']);
        $this->assertEquals('user', $roleMapping['user']);
    }
}

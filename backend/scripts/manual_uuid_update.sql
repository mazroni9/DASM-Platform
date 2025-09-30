-- Manual Keycloak UUID Update Script
-- Use this to manually update specific users with their Keycloak UUIDs

-- Example: Update a specific user by email
UPDATE users 
SET keycloak_uuid = 'your-keycloak-uuid-here' 
WHERE email = 'user@example.com';

-- Example: Update multiple users
UPDATE users 
SET keycloak_uuid = 'uuid-1' 
WHERE email = 'user1@example.com';

UPDATE users 
SET keycloak_uuid = 'uuid-2' 
WHERE email = 'user2@example.com';

-- Check which users still need UUIDs
SELECT id, email, first_name, last_name, role 
FROM users 
WHERE keycloak_uuid IS NULL;

-- Check which users have UUIDs
SELECT id, email, first_name, last_name, role, keycloak_uuid 
FROM users 
WHERE keycloak_uuid IS NOT NULL;

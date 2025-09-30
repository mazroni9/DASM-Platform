# Keycloak User Migration Guide

This guide explains how to migrate users from your local database to Keycloak.

## Fresh Keycloak Setup

If you're setting up Keycloak from scratch, follow these steps:

### Step 1: Install and Start Keycloak

#### Using Docker
```bash
# Create a docker-compose.yml file
cat > docker-compose.keycloak.yml << 'EOF'
version: '3.8'
services:
  keycloak:
    image: quay.io/keycloak/keycloak:latest
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin123
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres:5432/keycloak
      KC_DB_USERNAME: keycloak
      KC_DB_PASSWORD: keycloak
    ports:
      - "8080:8080"
    command: start-dev
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: keycloak
      POSTGRES_USER: keycloak
      POSTGRES_PASSWORD: keycloak
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
EOF

# Start Keycloak
docker-compose -f docker-compose.keycloak.yml up -d
```

### Step 2: Initial Keycloak Configuration

1. **Access Keycloak Admin Console**:
   - Go to `http://localhost:8080`
   - Click "Administration Console"
   - Login with `admin` / `admin123` (or your custom admin credentials)

2. **Create the DASM Platform Realm**:
   - Click the dropdown in the top-left corner (currently shows "Master")
   - Click "Create Realm"
   - Enter realm name: `dasm-platform`
   - Click "Create"

3. **Configure Realm Settings**:
   - Go to "Realm Settings" → "General"
   - Set "Display name": `DASM Platform`
   - Set "HTML Display name": `DASM Platform`
   - Click "Save"

### Step 3: Create the Backend Client

1. **Navigate to Clients**:
   - Go to "Clients" in the left sidebar
   - Click "Create client"

2. **Configure Client**:
   - **Client type**: `OpenID Connect`
   - **Client ID**: `dasm-backend`
   - Click "Next"

3. **Client Settings**:
   - **Client authentication**: `ON` (Confidential)
   - **Authorization**: `OFF`
   - **Authentication flow**: `Standard flow`, `Direct access grants`, `Service accounts roles`
   - Click "Next"

4. **Login Settings**:
   - Leave default settings
   - Click "Save"

5. **Get Client Secret**:
   - Go to "Credentials" tab
   - Copy the "Client secret" value
   - Update your backend `.env` file:
     ```env
     KEYCLOAK_CLIENT_SECRET=your-copied-secret-here
     ```

### Step 4: Create Client Roles

1. **Navigate to Client Roles**:
   - Go to "Clients" → `dasm-backend` → "Roles"
   - Click "Create role"

2. **Create Required Roles**:
   Create each of these roles:
   - **Role name**: `admin`, **Description**: `Administrator role with full system access`
   - **Role name**: `moderator`, **Description**: `Moderator role for auction management`
   - **Role name**: `venue_owner`, **Description**: `Venue owner role for venue management`
   - **Role name**: `investor`, **Description**: `Investor role for investment features`
   - **Role name**: `dealer`, **Description**: `Dealer role for car trading`
   - **Role name**: `user`, **Description**: `Basic user role`

### Step 5: Create Frontend Client (Optional)

If you need a separate frontend client:

1. **Create Frontend Client**:
   - Go to "Clients" → "Create client"
   - **Client ID**: `dasm-frontend`
   - **Client type**: `OpenID Connect`
   - Click "Next"

2. **Frontend Client Settings**:
   - **Client authentication**: `OFF` (Public)
   - **Standard flow**: `ON`
   - **Direct access grants**: `ON`
   - **Valid redirect URIs**: `http://localhost:3000/*`
   - **Web origins**: `http://localhost:3000`
   - Click "Save"

### Step 6: Test the Setup

1. **Test Realm Access**:
   ```bash
   # Test if realm is accessible
   curl http://localhost:8080/realms/dasm-platform
   ```

2. **Test Client Authentication**:
   ```bash
   # Test client credentials flow
   curl -X POST http://localhost:8080/realms/dasm-platform/protocol/openid-connect/token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=client_credentials&client_id=dasm-backend&client_secret=YOUR_CLIENT_SECRET"
   ```

3. **Verify Backend Configuration**:
   ```bash
   cd backend
   php artisan migrate:users-to-keycloak --dry-run
   ```

### Step 7: Create Test Users (Optional)

1. **Create Test Users**:
   - Go to "Users" → "Create new user"
   - **Username**: `admin@dasm-platform.com`
   - **Email**: `admin@dasm-platform.com`
   - **First name**: `Admin`
   - **Last name**: `User`
   - **Email verified**: `ON`
   - Click "Create"

2. **Set Password**:
   - Go to "Credentials" tab
   - Click "Set password"
   - **Password**: `TempPassword123!`
   - **Temporary**: `ON`
   - Click "Save"

3. **Assign Roles**:
   - Go to "Role mapping" tab
   - Click "Assign role"
   - Select "Filter by clients"
   - Select `dasm-backend`
   - Assign the `admin` role
   - Click "Assign"

### Troubleshooting Fresh Setup

#### Common Issues:

1. **Keycloak Won't Start**:
   ```bash
   # Check if port 8080 is in use
   netstat -an | findstr :8080
   
   # Kill process using port 8080
   taskkill /PID <PID_NUMBER> /F
   ```

2. **Client Secret Not Working**:
   - Verify the client secret is copied correctly
   - Check that client authentication is set to "ON"
   - Ensure service accounts are enabled

3. **Realm Not Found**:
   - Verify the realm name is exactly `dasm-platform`
   - Check that the realm is enabled
   - Ensure you're accessing the correct Keycloak instance

4. **Roles Not Found**:
   - Verify roles are created under the correct client (`dasm-backend`)
   - Check that role names match exactly: `admin`, `moderator`, `venue_owner`, `investor`, `dealer`, `user`

#### Verification Commands:

```bash
# Check if Keycloak is running
curl http://localhost:8080/health

# Check if realm exists
curl http://localhost:8080/realms/dasm-platform

# Check if client exists (requires admin token)
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:8080/admin/realms/dasm-platform/clients?clientId=dasm-backend
```

## Prerequisites

1. **Keycloak Server Running**: Ensure Keycloak is running at `http://localhost:8080`
2. **Backend Configuration**: Make sure your `.env` file has the correct Keycloak settings:
   ```env
   KEYCLOAK_SERVER_URL=http://localhost:8080
   KEYCLOAK_REALM=dasm-platform
   KEYCLOAK_CLIENT_ID=dasm-backend
   KEYCLOAK_CLIENT_SECRET=your-client-secret-here
   ```

3. **Database Migration**: Ensure the `keycloak_uuid` column exists in your users table:
   ```bash
   php artisan migrate
   ```

## Step 1: Setup Keycloak for Migration

First, prepare Keycloak by creating the necessary client and roles:

```bash
# Run the setup script
php artisan setup:keycloak-for-migration
```

This script will:
- Create the `dasm-backend` client if it doesn't exist
- Create client roles: `admin`, `moderator`, `venue_owner`, `investor`, `dealer`, `user`
- Configure client settings for user management

## Step 2: Test Migration (Dry Run)

Before migrating actual users, run a dry run to see what would happen:

```bash
# Dry run with default batch size (50)
php artisan migrate:users-to-keycloak --dry-run

# Dry run with custom batch size
php artisan migrate:users-to-keycloak --dry-run --batch-size=25
```

This will show you:
- How many users will be migrated
- What changes would be made
- Any potential issues

## Step 3: Run the Migration

Once you're satisfied with the dry run, execute the actual migration:

```bash
# Migrate all users
php artisan migrate:users-to-keycloak

# Migrate with custom batch size
php artisan migrate:users-to-keycloak --batch-size=25

# Skip confirmation prompt
php artisan migrate:users-to-keycloak --force
```

## Migration Process

The migration process will:

1. **Authenticate** with Keycloak using client credentials
2. **Fetch users** from your database that don't have a `keycloak_uuid`
3. **Check for existing users** in Keycloak by email
4. **Create new users** in Keycloak with:
   - Username (email)
   - First name and last name
   - Email verification status
   - Custom attributes (phone, KYC status, original user ID)
5. **Set temporary passwords** (users will need to change on first login)
6. **Assign roles** based on the user's current role
7. **Update local database** with the Keycloak UUID

## User Data Mapping

| Database Field | Keycloak Field | Notes |
|----------------|----------------|-------|
| `email` | `username`, `email` | Used as both username and email |
| `first_name` | `firstName` | |
| `last_name` | `lastName` | |
| `is_active` | `enabled` | |
| `email_verified_at` | `emailVerified` | Boolean based on verification |
| `phone` | `attributes.phone` | Custom attribute |
| `kyc_status` | `attributes.kyc_status` | Custom attribute |
| `id` | `attributes.original_user_id` | For reference |
| `role` | Client Role | Mapped to Keycloak client roles |

## Role Mapping

| Application Role | Keycloak Client Role |
|------------------|---------------------|
| `admin` | `admin` |
| `moderator` | `moderator` |
| `venue_owner` | `venue_owner` |
| `investor` | `investor` |
| `dealer` | `dealer` |
| `user` | `user` |

## Password Handling

- **Existing passwords**: Cannot be migrated directly due to security
- **Temporary passwords**: Set to `TempPassword123!` for all users
- **First login**: Users must change their password on first login
- **Password reset**: Users can use Keycloak's password reset functionality

## Monitoring and Logs

The migration process provides detailed logging:

- **Console output**: Real-time progress and results
- **Laravel logs**: Detailed error logs in `storage/logs/laravel.log`
- **Progress bar**: Shows migration progress
- **Summary table**: Final statistics

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   ```
   Cannot authenticate with Keycloak
   ```
   - Check your `KEYCLOAK_CLIENT_SECRET` in `.env`
   - Ensure the client exists in Keycloak
   - Verify the client has "Service accounts enabled"

2. **Role Not Found**
   ```
   Role admin not found in Keycloak
   ```
   - Run the setup script: `php artisan setup:keycloak-for-migration`
   - Check that client roles were created

3. **User Already Exists**
   ```
   User already exists in Keycloak
   ```
   - The script will skip existing users and update the local record
   - This is normal behavior

4. **Database Connection Issues**
   ```
   SQLSTATE[HY000] [2002] Connection refused
   ```
   - Ensure your database is running
   - Check database configuration in `.env`

### Manual Verification

After migration, verify the results:

1. **Check Keycloak Admin Console**:
   - Go to `http://localhost:8080/admin`
   - Navigate to Users → View all users
   - Verify users were created with correct roles

2. **Check Database**:
   ```sql
   SELECT id, email, keycloak_uuid, role 
   FROM users 
   WHERE keycloak_uuid IS NOT NULL;
   ```

3. **Test Login**:
   - Try logging in with migrated users
   - Verify role-based access works correctly

## Rollback (If Needed)

If you need to rollback the migration:

1. **Remove Keycloak UUIDs**:
   ```sql
   UPDATE users SET keycloak_uuid = NULL;
   ```

2. **Delete users from Keycloak** (optional):
   - Use Keycloak Admin Console
   - Or create a cleanup script

3. **Revert authentication**:
   - Change `auth.php` back to use `sanctum` guard
   - Update API routes to use `auth:sanctum` middleware

## Post-Migration Steps

1. **Update Frontend**: Ensure frontend is configured to use Keycloak authentication
2. **Test Authentication**: Verify login/logout works correctly
3. **Test Authorization**: Check that role-based access works
4. **User Communication**: Inform users about password reset requirements
5. **Monitor**: Watch for any authentication issues

## Security Considerations

- **Temporary passwords**: All users get the same temporary password
- **Password policy**: Configure Keycloak password policies
- **Account lockout**: Set up account lockout policies
- **Audit logging**: Enable Keycloak audit logging
- **Backup**: Backup both database and Keycloak before migration

## Support

If you encounter issues:

1. Check the Laravel logs: `storage/logs/laravel.log`
2. Check Keycloak logs in the Keycloak server
3. Verify network connectivity between backend and Keycloak
4. Ensure all environment variables are correct

## Commands Summary

```bash
# Setup Keycloak for migration
php artisan setup:keycloak-for-migration

# Dry run migration
php artisan migrate:users-to-keycloak --dry-run

# Run migration
php artisan migrate:users-to-keycloak

# Run with custom batch size
php artisan migrate:users-to-keycloak --batch-size=25

# Run without confirmation
php artisan migrate:users-to-keycloak --force
```

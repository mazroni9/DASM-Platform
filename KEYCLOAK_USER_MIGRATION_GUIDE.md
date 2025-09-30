# Keycloak User Migration Guide

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

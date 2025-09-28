# Keycloak User Migration Guide

## Current Situation
Your existing users in the database are not yet created in Keycloak. This is normal when migrating to Keycloak authentication.

## Solutions

### Option 1: Manual User Creation (Recommended for Testing)
1. **Access Keycloak Admin Console**: http://localhost:8080/admin
2. **Login**: admin / admin
3. **Navigate to**: Users → Add User
4. **Create users** with the same email addresses as in your database
5. **Set passwords** for each user
6. **Assign roles** (admin, dealer, moderator, etc.)

### Option 2: Bulk User Import (For Production)
Create a script to import users from your database to Keycloak using the Keycloak Admin API.

### Option 3: Hybrid Approach (Temporary)
Allow both Keycloak and local authentication during the transition period.

## Testing Users
For immediate testing, create these users in Keycloak:

1. **Admin User**:
   - Email: admin@dasm-platform.com
   - Password: admin123
   - Role: admin

2. **Dealer User**:
   - Email: dealer@dasm-platform.com
   - Password: dealer123
   - Role: dealer

3. **Regular User**:
   - Email: user@dasm-platform.com
   - Password: user123
   - Role: user

## Next Steps
1. Create test users in Keycloak
2. Test login with these users
3. Plan migration strategy for existing database users
4. Consider implementing user sync between database and Keycloak

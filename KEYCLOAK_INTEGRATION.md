# Keycloak Authentication Integration

This document describes the Keycloak authentication integration implemented for the DASM Platform.

## Overview

The authentication system has been refactored to use Keycloak as the identity provider while maintaining the existing login interface and user experience. The implementation uses JWT tokens for stateless authentication.

## Architecture

### Backend (Laravel)
- **JWT Guard**: Custom guard that validates Keycloak JWT tokens
- **User Provider**: Custom provider that retrieves users from the database using Keycloak UUID
- **JWT Service**: Service for validating JWT tokens and extracting user information
- **Token Validation**: Validates tokens using Keycloak's public keys from JWKS endpoint

### Frontend (Next.js)
- **Keycloak Service**: Service for handling Keycloak authentication flows
- **Auth Store**: Updated to support Keycloak authentication
- **Login Form**: Modified to use Keycloak authentication while maintaining the same UI

## Configuration

### Backend Configuration

Add the following environment variables to your `.env` file:

```env
# Keycloak Configuration
KEYCLOAK_SERVER_URL=http://localhost:8080
KEYCLOAK_REALM=master
KEYCLOAK_CLIENT_ID=dasm-platform
KEYCLOAK_CLIENT_SECRET=your-client-secret-here

# Update auth guard to use Keycloak
AUTH_GUARD=keycloak
```

### Frontend Configuration

Add the following environment variables to your `.env.local` file:

```env
# Keycloak Configuration
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080
NEXT_PUBLIC_KEYCLOAK_REALM=master
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=dasm-platform

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Keycloak Setup

### 1. Create a Realm
1. Access Keycloak admin console at `http://localhost:8080`
2. Create a new realm called `dasm-platform` (or use `master`)
3. Configure realm settings as needed

### 2. Create a Client
1. In your realm, go to "Clients" → "Create"
2. Set Client ID: `dasm-platform`
3. Set Client Protocol: `openid-connect`
4. Set Access Type: `public` (for SPA) or `confidential` (for backend)
5. Set Valid Redirect URIs: `http://localhost:3000/*`
6. Set Web Origins: `http://localhost:3000`
7. Enable "Direct Access Grants Enabled" for ROPC flow
8. Enable "Service Accounts Enabled" if using confidential client

### 3. Create Roles
Create the following client roles in your Keycloak client:
- `admin`
- `dealer`
- `moderator`
- `venue_owner`
- `investor`
- `user`

### 4. Create Users
1. Go to "Users" → "Add user"
2. Create users with appropriate roles assigned
3. Set passwords and enable accounts

## Database Changes

The following migration has been added to support Keycloak:

```sql
ALTER TABLE users ADD COLUMN keycloak_uuid VARCHAR(255) UNIQUE;
```

## Authentication Flow

### 1. Login Process
1. User enters credentials in the existing login form
2. Frontend calls `loginWithKeycloak()` method
3. Keycloak validates credentials using ROPC flow
4. Keycloak returns JWT tokens (access, refresh, ID)
5. Frontend validates token with backend
6. Backend creates/updates user record with Keycloak UUID
7. User is authenticated and redirected to dashboard

### 2. Token Validation
1. Frontend sends JWT token in Authorization header
2. Backend validates token signature using Keycloak's public keys
3. Backend extracts user information from token claims
4. Backend retrieves/creates user record from database
5. User is authenticated for the request

### 3. Role Mapping
- Keycloak client roles are mapped to application roles
- Role mapping is configured in `config/keycloak.php`
- Default role is assigned if no role is found in token

## API Endpoints

### New Endpoints
- `POST /api/validate-keycloak-token` - Validates Keycloak JWT token

### Updated Endpoints
All protected routes now use the `keycloak` guard instead of `sanctum`.

## Security Considerations

1. **JWT Validation**: All JWT tokens are validated using Keycloak's public keys
2. **Token Expiration**: Tokens are checked for expiration
3. **Role-based Access**: User roles are extracted from JWT claims
4. **Secure Storage**: Access tokens are stored in memory, refresh tokens in HTTP-only cookies
5. **CORS**: Proper CORS headers are configured for Keycloak integration

## Testing

### 1. Start Keycloak
```bash
docker run -p 8080:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:latest start-dev
```

### 2. Configure Keycloak
1. Access admin console at `http://localhost:8080`
2. Create realm and client as described above
3. Create test users with appropriate roles

### 3. Test Authentication
1. Start the Laravel backend
2. Start the Next.js frontend
3. Navigate to login page
4. Enter Keycloak user credentials
5. Verify successful authentication and role-based access

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure Keycloak client has correct Web Origins configured
2. **Token Validation Fails**: Check Keycloak server URL and realm configuration
3. **User Not Found**: Verify user exists in Keycloak and has correct roles
4. **Role Mapping Issues**: Check role mapping configuration in `config/keycloak.php`
5. **SSR Errors**: The Keycloak integration is designed to work with Next.js SSR. All Keycloak-related code runs client-side only.
6. **401 Errors on Device Token Registration**: The Firebase messaging provider now only registers device tokens when the user is authenticated. This prevents 401 errors during app initialization.

### Debug Mode

Enable debug logging by setting `LOG_LEVEL=debug` in your `.env` file.

### SSR Compatibility

The Keycloak integration is fully compatible with Next.js Server-Side Rendering:
- Keycloak initialization only runs on the client side
- Auth store methods check for `window` object before executing
- Components are wrapped with proper client-side guards
- No hydration mismatches occur

### Firebase Messaging Integration

The Firebase messaging provider has been updated to work with Keycloak authentication:
- Device token registration only occurs when user is authenticated
- Prevents 401 errors during app initialization
- Automatically registers device token when user logs in
- Resets registration state when user logs out
- Maintains push notification functionality for authenticated users

## Migration from Sanctum

The system has been designed to maintain backward compatibility. Existing users can continue to use the system while new users are authenticated via Keycloak. The migration process:

1. Existing users retain their local authentication
2. New users are authenticated via Keycloak
3. User records are updated with Keycloak UUID when they first authenticate
4. Role information is synchronized from Keycloak

## Future Enhancements

1. **SSO Integration**: Add support for SAML/OIDC providers
2. **Multi-factor Authentication**: Leverage Keycloak's MFA capabilities
3. **User Federation**: Integrate with LDAP/Active Directory
4. **Token Refresh**: Implement automatic token refresh
5. **Session Management**: Add session timeout and management features

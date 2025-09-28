# Keycloak Client Setup Guide

## Current Issue
The Keycloak client `dasm-platform` is not properly configured for the ROPC (Resource Owner Password Credentials) flow, causing initialization failures.

## Step-by-Step Fix

### 1. Access Keycloak Admin Console
1. **Open**: http://localhost:8080/admin
2. **Login**: admin / admin

### 2. Navigate to Client Configuration
1. **Click**: "Clients" in the left sidebar
2. **Find**: `dasm-platform` client
3. **Click**: on the client name to edit

### 3. Configure Client Settings

#### **General Settings Tab:**
- **Client ID**: `dasm-platform` (should already be set)
- **Client Protocol**: `openid-connect`
- **Client authentication**: `ON` (IMPORTANT: This makes it confidential)
- **Authorization**: `OFF`
- **Authentication flow overrides**: Leave as default
- **Login theme**: Leave as default

#### **Credentials Tab:**
- **Client Authenticator**: `Client Id and Secret`
- **Secret**: Copy the secret value (you'll need this for backend .env)

#### **Login settings Tab:**
- **Root URL**: `http://localhost:3000`
- **Home URL**: `http://localhost:3000`
- **Valid redirect URIs**: Add the URIs below
- **Valid post logout redirect URIs**: `http://localhost:3000/*`
- **Web origins**: Add the origins below

#### **Capability config Tab:**
- **Client authentication**: `ON` (should already be set from General tab)
- **Standard flow**: `ON`
- **Direct access grants**: `ON` (CRITICAL for ROPC)
- **Service accounts roles**: `ON`
- **OAuth 2.0 Device Authorization Grant**: `OFF`
- **OIDC CIBA Grant**: `OFF`

#### **Valid Redirect URIs:**
Add these URIs:
```
http://localhost:3000/*
http://localhost:3000/dashboard
http://localhost:3000/auth/login
http://localhost:3000/silent-check-sso.html
```

#### **Web Origins:**
Add these origins:
```
http://localhost:3000
http://localhost:8080
```

### 4. Update Backend Environment
Add the client secret to your backend `.env`:
```bash
KEYCLOAK_CLIENT_SECRET=your-copied-secret-here
```

### 5. Test Configuration
After making these changes:
1. **Restart your frontend** (to clear any cached configurations)
2. **Try logging in** again
3. **Check browser console** for any remaining errors

## Alternative: Create New Client
If the existing client has issues, create a new one:

### 1. Create New Client
1. **Click**: "Create" in Clients page
2. **Client ID**: `dasm-platform-new`
3. **Client Protocol**: `openid-connect`
4. **Root URL**: `http://localhost:3000`

### 2. Configure New Client
Follow the same settings as above, then update your frontend `.env`:
```bash
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=dasm-platform-new
```

## Expected Result
After proper configuration:
- ✅ Keycloak initialization should succeed
- ✅ ROPC login should work
- ✅ No more 400 Bad Request errors
- ✅ Proper token generation

## Troubleshooting
If you still get errors:
1. **Check Keycloak logs**: `docker logs dasm-keycloak --tail 50`
2. **Verify client settings** match the guide above
3. **Ensure Direct Access Grants** is enabled
4. **Check that client is confidential** (not public)

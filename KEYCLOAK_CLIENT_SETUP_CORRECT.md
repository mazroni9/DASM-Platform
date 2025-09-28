# Correct Keycloak Client Setup Guide

## Current Issue
The frontend is trying to use `dasm-backend` (confidential client) but it should use a public client for ROPC flow.

## Solution: Create Two Separate Clients

### Client 1: dasm-backend (Confidential - for Backend API)
- **Purpose**: Backend API authentication
- **Type**: Confidential client
- **Authentication**: Client ID + Secret

### Client 2: dasm-frontend (Public - for Frontend ROPC)
- **Purpose**: Frontend ROPC authentication
- **Type**: Public client
- **Authentication**: Client ID only

## Step-by-Step Setup

### Step 1: Access Keycloak Admin Console
1. **Go to**: http://localhost:8080/admin
2. **Login**: admin / admin
3. **Switch to realm**: `dasm-platform`

### Step 2: Create Frontend Client (dasm-frontend)

#### **Create Client:**
1. **Click**: "Clients" → "Create client"
2. **Client ID**: `dasm-frontend`
3. **Client protocol**: `openid-connect`
4. **Root URL**: `http://localhost:3000`
5. **Click**: "Save"

#### **Configure Frontend Client:**

**General Settings Tab:**
- **Client authentication**: `OFF` (public client)
- **Authorization**: `OFF`

**Capability config Tab:**
- **Client authentication**: `OFF`
- **Standard flow**: `ON`
- **Direct access grants**: `ON` (CRITICAL for ROPC!)
- **Service accounts roles**: `OFF`

**Login settings Tab:**
- **Root URL**: `http://localhost:3000`
- **Valid redirect URIs**: 
  ```
  http://localhost:3000/*
  http://localhost:3000/auth/login*
  http://localhost:3000/dashboard
  ```
- **Web origins**: 
  ```
  http://localhost:3000
  ```

### Step 3: Configure Backend Client (dasm-backend)

#### **If dasm-backend doesn't exist, create it:**
1. **Click**: "Clients" → "Create client"
2. **Client ID**: `dasm-backend`
3. **Client protocol**: `openid-connect`
4. **Root URL**: `http://localhost:8000`
5. **Click**: "Save"

#### **Configure Backend Client:**

**General Settings Tab:**
- **Client authentication**: `ON` (confidential client)
- **Authorization**: `OFF`

**Credentials Tab:**
- **Client Authenticator**: `Client Id and Secret`
- **Copy the Secret** (you'll need this for backend .env)

**Capability config Tab:**
- **Client authentication**: `ON`
- **Standard flow**: `ON`
- **Direct access grants**: `ON`
- **Service accounts roles**: `ON`

**Login settings Tab:**
- **Root URL**: `http://localhost:8000`
- **Valid redirect URIs**: 
  ```
  http://localhost:8000/*
  ```
- **Web origins**: 
  ```
  http://localhost:8000
  ```

### Step 4: Update Environment Variables

#### **Frontend .env (already updated):**
```bash
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080
NEXT_PUBLIC_KEYCLOAK_REALM=dasm-platform
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=dasm-frontend
```

#### **Backend .env:**
```bash
KEYCLOAK_SERVER_URL=http://localhost:8080
KEYCLOAK_REALM=dasm-platform
KEYCLOAK_CLIENT_ID=dasm-backend
KEYCLOAK_CLIENT_SECRET=your-copied-secret-here
```

### Step 5: Create Test Users
1. **Navigate to**: Users → Add user
2. **Create these test users**:

```
User 1:
- Username: admin
- Email: admin@dasm-platform.com
- Password: admin123

User 2:
- Username: dealer
- Email: dealer@dasm-platform.com
- Password: dealer123

User 3:
- Username: user
- Email: user@dasm-platform.com
- Password: user123
```

### Step 6: Test the Configuration

#### **Test Frontend Client:**
```bash
# Test ROPC flow (should work without client secret)
curl -X POST http://localhost:8080/realms/dasm-platform/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=dasm-frontend&username=admin&password=admin123"
```

#### **Test Backend Client:**
```bash
# Test client credentials (should work with client secret)
curl -X POST http://localhost:8080/realms/dasm-platform/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=dasm-backend&client_secret=YOUR_SECRET"
```

## Expected Results
- ✅ **Frontend uses public client** (dasm-frontend)
- ✅ **Backend uses confidential client** (dasm-backend)
- ✅ **No more 401 Unauthorized errors**
- ✅ **Proper ROPC authentication flow**

## Key Differences
| Client | Type | Authentication | Use Case |
|--------|------|----------------|----------|
| dasm-frontend | Public | Client ID only | Frontend ROPC |
| dasm-backend | Confidential | Client ID + Secret | Backend API |

## Troubleshooting
If you still get errors:
1. **Verify both clients exist** in the dasm-platform realm
2. **Check Direct access grants** is enabled for both clients
3. **Ensure frontend client is public** (Client authentication: OFF)
4. **Ensure backend client is confidential** (Client authentication: ON)
5. **Verify redirect URIs** are correctly configured

# Final Keycloak Client Setup Guide

## Current Issue
The frontend is now correctly configured to use:
- **Realm**: `dasm-platform` ✅
- **Client**: `dasm-backend` ✅

But the `dasm-backend` client doesn't exist yet in the `dasm-platform` realm.

## Step-by-Step Setup

### Step 1: Access Keycloak Admin Console
1. **Go to**: http://localhost:8080/admin
2. **Login**: admin / admin

### Step 2: Switch to the Correct Realm
1. **Click the realm dropdown** (top left, currently shows "master")
2. **Select**: `dasm-platform`

### Step 3: Create the Backend Client
1. **Click**: "Clients" in the left sidebar
2. **Click**: "Create client"
3. **Fill in**:
   - **Client ID**: `dasm-backend`
   - **Client protocol**: `openid-connect`
   - **Root URL**: `http://localhost:8000`
4. **Click**: "Save"

### Step 4: Configure Client Settings

#### **General Settings Tab:**
- **Client authentication**: `ON` (confidential client)
- **Authorization**: `OFF`

#### **Credentials Tab:**
- **Client Authenticator**: `Client Id and Secret`
- **Copy the Secret** (you'll need this for backend .env)

#### **Capability config Tab:**
- **Client authentication**: `ON`
- **Standard flow**: `ON`
- **Direct access grants**: `ON` (CRITICAL for ROPC!)
- **Service accounts roles**: `ON`

#### **Login settings Tab:**
- **Root URL**: `http://localhost:8000`
- **Valid redirect URIs**: 
  ```
  http://localhost:8000/*
  http://localhost:3000/*
  ```
- **Web origins**: 
  ```
  http://localhost:8000
  http://localhost:3000
  ```

### Step 5: Create Backend .env File
Create a `.env` file in the `backend` directory:

```bash
# Keycloak Configuration
KEYCLOAK_SERVER_URL=http://localhost:8080
KEYCLOAK_REALM=dasm-platform
KEYCLOAK_CLIENT_ID=dasm-backend
KEYCLOAK_CLIENT_SECRET=your-copied-secret-here

# Basic Laravel config
APP_NAME=DASM-Platform
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database (adjust as needed)
DB_CONNECTION=pgsql
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=dasm_platform
DB_USERNAME=postgres
DB_PASSWORD=password
```

### Step 6: Create Test Users
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

### Step 7: Test the Configuration

#### **Test Backend Connection:**
```bash
# Test realm access
curl http://localhost:8080/realms/dasm-platform

# Test client credentials (replace YOUR_SECRET with actual secret)
curl -X POST http://localhost:8080/realms/dasm-platform/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=dasm-backend&client_secret=YOUR_SECRET"
```

#### **Test Frontend Login:**
1. **Restart your frontend** (to pick up new environment variables)
2. **Try logging in** with test users
3. **Check browser console** for any errors

## Expected Results
- ✅ **No more 401 Unauthorized errors**
- ✅ **Proper authentication flow**
- ✅ **Clean realm separation**

## Troubleshooting
If you still get errors:
1. **Verify realm exists**: http://localhost:8080/realms/dasm-platform
2. **Check client exists**: http://localhost:8080/admin → dasm-platform realm → Clients
3. **Ensure Direct access grants** is enabled
4. **Verify client secret** is correct in backend .env
5. **Check Keycloak logs**: `docker logs dasm-keycloak --tail 50`

## Quick Verification Commands
```bash
# Check if realm exists
curl http://localhost:8080/realms/dasm-platform

# Check if client exists (will return 404 if not found)
curl http://localhost:8080/realms/dasm-platform/protocol/openid-connect/token \
  -X POST \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=dasm-backend&client_secret=test"
```

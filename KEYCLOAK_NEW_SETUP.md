# New Keycloak Setup Guide

## Configuration Overview
We're now using a dedicated realm and client for better security and organization:

- **Realm**: `dasm-platform` (instead of `master`)
- **Client**: `dasm-backend` (instead of `dasm-platform`)
- **Server**: `http://localhost:8080`

## Step 1: Create the New Realm

### Access Keycloak Admin Console
1. **Go to**: http://localhost:8080/admin
2. **Login**: admin / admin

### Create New Realm
1. **Click**: "Create realm" (top left)
2. **Realm name**: `dasm-platform`
3. **Click**: "Create"

## Step 2: Create the Backend Client

### Create Client
1. **In the new realm**: Click "Clients" → "Create client"
2. **Client ID**: `dasm-backend`
3. **Client protocol**: `openid-connect`
4. **Root URL**: `http://localhost:8000`
5. **Click**: "Save"

### Configure Client Settings

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

## Step 3: Create Frontend Client (Optional)

### Create Another Client for Frontend
1. **Create client**: `dasm-frontend`
2. **Client protocol**: `openid-connect`
3. **Root URL**: `http://localhost:3000`

#### **Frontend Client Settings:**
- **Client authentication**: `OFF` (public client)
- **Standard flow**: `ON`
- **Direct access grants**: `ON`
- **Valid redirect URIs**: 
  ```
  http://localhost:3000/*
  http://localhost:3000/dashboard
  http://localhost:3000/auth/login
  http://localhost:3000/silent-check-sso.html
  ```

## Step 4: Update Environment Variables

### Frontend .env
```bash
# Keycloak Configuration
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080
NEXT_PUBLIC_KEYCLOAK_REALM=dasm-platform
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=dasm-backend
```

### Backend .env
```bash
# Keycloak Configuration
KEYCLOAK_SERVER_URL=http://localhost:8080
KEYCLOAK_REALM=dasm-platform
KEYCLOAK_CLIENT_ID=dasm-backend
KEYCLOAK_CLIENT_SECRET=your-copied-secret-here
KEYCLOAK_ADMIN_USER=admin
KEYCLOAK_ADMIN_PASSWORD=admin123
KEYCLOAK_DB_PASSWORD=keycloak_password
KEYCLOAK_HOSTNAME=localhost
KEYCLOAK_PORT=8080
KEYCLOAK_LOG_LEVEL=INFO

# Update auth guard to use Keycloak
AUTH_GUARD=keycloak
```

## Step 5: Create Test Users

### Create Users in New Realm
1. **Navigate to**: Users → Add user
2. **Create these test users**:

```
User 1:
- Username: admin
- Email: admin@dasm-platform.com
- Password: admin123
- Role: admin

User 2:
- Username: dealer
- Email: dealer@dasm-platform.com
- Password: dealer123
- Role: dealer

User 3:
- Username: user
- Email: user@dasm-platform.com
- Password: user123
- Role: user
```

### Assign Roles
1. **Go to**: Users → [username] → Role mapping
2. **Assign appropriate roles** from the realm roles

## Step 6: Test the Configuration

### Test Backend Connection
```bash
# Test realm access
curl http://localhost:8080/realms/dasm-platform

# Test client credentials
curl -X POST http://localhost:8080/realms/dasm-platform/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=dasm-backend&client_secret=YOUR_SECRET"
```

### Test Frontend Login
1. **Restart frontend** (to pick up new config)
2. **Try logging in** with test users
3. **Check browser console** for any errors

## Expected Results
- ✅ **No more 401/400 errors**
- ✅ **Proper realm isolation**
- ✅ **Better security with dedicated client**
- ✅ **Clean separation of concerns**

## Troubleshooting
If you encounter issues:
1. **Verify realm exists**: http://localhost:8080/realms/dasm-platform
2. **Check client configuration** matches the guide
3. **Ensure Direct access grants** is enabled
4. **Verify client secret** is correct in backend .env
5. **Check Keycloak logs**: `docker logs dasm-keycloak --tail 50`

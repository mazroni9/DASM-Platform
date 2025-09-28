# Backend Keycloak Setup Guide

## Current Issue
The backend is returning 401 Unauthorized because the `KEYCLOAK_CLIENT_SECRET` is set to a placeholder value.

## Solution: Get the Real Client Secret

### Step 1: Access Keycloak Admin Console
1. **Go to**: http://localhost:8080/admin
2. **Login**: admin / admin
3. **Switch to realm**: `dasm-platform`

### Step 2: Get the Client Secret
1. **Navigate to**: Clients → `dasm-backend`
2. **Click**: "Credentials" tab
3. **Copy the Secret** value (it should be a long string of characters)

### Step 3: Update Backend .env File
1. **Open**: `backend/.env`
2. **Find the line**: `KEYCLOAK_CLIENT_SECRET=your-client-secret-here`
3. **Replace with**: `KEYCLOAK_CLIENT_SECRET=your-actual-secret-here`

### Step 4: Test the Configuration

#### **Test Backend Connection:**
```bash
# Test client credentials (replace YOUR_SECRET with actual secret)
curl -X POST http://localhost:8080/realms/dasm-platform/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=dasm-backend&client_secret=YOUR_SECRET"
```

#### **Test Backend API:**
```bash
# Test the debug endpoint
curl http://localhost:8000/api/debug-keycloak-config
```

### Step 5: Restart Backend (if needed)
If you're running the backend with a process manager, restart it to pick up the new environment variables.

## Expected Results
After updating the client secret:
- ✅ **Backend can authenticate with Keycloak**
- ✅ **Token validation should work**
- ✅ **No more 401 errors from `/api/validate-keycloak-token`**

## Troubleshooting
If you still get 401 errors:
1. **Verify the client secret** is correct (no extra spaces, correct case)
2. **Check that `dasm-backend` client exists** in the `dasm-platform` realm
3. **Ensure Direct access grants** is enabled for the client
4. **Verify the client is confidential** (Client authentication: ON)
5. **Check Keycloak logs**: `docker logs dasm-keycloak --tail 50`

## Quick Verification
After updating the secret, test with:
```bash
# This should return a valid token
curl -X POST http://localhost:8080/realms/dasm-platform/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=dasm-backend&client_secret=YOUR_ACTUAL_SECRET"
```

If this returns a token, the backend configuration is correct!

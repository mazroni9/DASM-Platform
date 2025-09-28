# Keycloak Token Validation Debug Guide

## Current Issue
The backend is now using the correct client secret but returning "Invalid or expired token" when validating the JWT token from the frontend.

## Debugging Steps

### Step 1: Test JWKS Endpoint
Test if the JWKS endpoint is accessible:

```bash
# Test JWKS endpoint
curl http://localhost:8080/realms/dasm-platform/protocol/openid-connect/certs

# Should return JSON with keys array
```

### Step 2: Test Token Generation
Get a fresh token and test it:

```bash
# Get a token using ROPC flow (like frontend does)
curl -X POST http://localhost:8080/realms/dasm-platform/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=dasm-frontend&username=admin&password=admin123"

# Copy the access_token from the response
```

### Step 3: Test Token Validation
Test the token validation endpoint with the fresh token:

```bash
# Replace YOUR_TOKEN with the actual token from step 2
curl -X POST http://localhost:8000/api/validate-keycloak-token \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Step 4: Check Backend Logs
Enable detailed logging to see what's happening:

```bash
# Check if logs exist
ls -la storage/logs/

# If no logs, create a test log entry
php artisan tinker
# Then in tinker:
Log::info('Test log entry');
exit

# Check the log
tail -f storage/logs/laravel.log
```

### Step 5: Test JWKS Fetching
Test if the backend can fetch JWKS:

```bash
# Test JWKS endpoint from backend
curl http://localhost:8080/realms/dasm-platform/protocol/openid-connect/certs
```

## Common Issues and Solutions

### Issue 1: JWKS Endpoint Not Accessible
**Symptoms**: Backend can't fetch JWKS
**Solution**: Check if Keycloak is running and accessible

### Issue 2: Token Format Issues
**Symptoms**: JWT decode fails
**Solution**: Check if token is properly formatted

### Issue 3: Signature Validation Fails
**Symptoms**: Token signature doesn't match
**Solution**: Check if JWKS keys are correct

### Issue 4: Token Expired
**Symptoms**: Token is valid but expired
**Solution**: Get a fresh token

### Issue 5: Audience Mismatch
**Symptoms**: Token audience doesn't match expected client
**Solution**: Check token audience claim

## Quick Test Script
Create a test script to debug the issue:

```bash
# Create test script
cat > test_token.sh << 'EOF'
#!/bin/bash

echo "1. Testing JWKS endpoint..."
curl -s http://localhost:8080/realms/dasm-platform/protocol/openid-connect/certs | jq .

echo -e "\n2. Getting fresh token..."
TOKEN=$(curl -s -X POST http://localhost:8080/realms/dasm-platform/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=dasm-frontend&username=admin&password=admin123" | jq -r .access_token)

echo "Token: $TOKEN"

echo -e "\n3. Testing token validation..."
curl -X POST http://localhost:8000/api/validate-keycloak-token \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

echo -e "\n4. Testing backend config..."
curl -s http://localhost:8000/api/debug-keycloak-config | jq .
EOF

chmod +x test_token.sh
./test_token.sh
```

## Expected Results
- ✅ **JWKS endpoint returns valid JSON**
- ✅ **Token generation works**
- ✅ **Token validation succeeds**
- ✅ **Backend config shows correct settings**

## Troubleshooting
If you still get errors:
1. **Check Keycloak logs**: `docker logs dasm-keycloak --tail 50`
2. **Verify realm exists**: `curl http://localhost:8080/realms/dasm-platform`
3. **Check client configuration** in Keycloak admin
4. **Verify token format** (should be a JWT)
5. **Check network connectivity** between backend and Keycloak

The key is to get a fresh token and test the validation step by step!

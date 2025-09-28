# Backend Restart Guide

## Current Issue
The backend is still using the old client secret (`your-client-secret-here`) even though you updated the `.env` file. This means the backend needs to be restarted to pick up the new environment variables.

## Solution: Restart the Backend

### Step 1: Check How Backend is Running
The backend might be running in different ways:

#### **Option A: Docker Container**
```bash
# Check if running in Docker
docker ps | grep backend

# If running in Docker, restart the container
docker restart your-backend-container-name
```

#### **Option B: PHP Artisan Serve**
```bash
# If running with artisan serve, stop it (Ctrl+C) and restart
cd backend
php artisan serve --host=0.0.0.0 --port=8000
```

#### **Option C: Process Manager (Supervisor, PM2, etc.)**
```bash
# If using a process manager, restart the service
# Example for supervisor:
sudo supervisorctl restart laravel-worker

# Example for PM2:
pm2 restart laravel-app
```

#### **Option D: Web Server (Apache/Nginx)**
```bash
# If using a web server, restart it
# For Apache:
sudo systemctl restart apache2

# For Nginx:
sudo systemctl restart nginx
```

### Step 2: Verify the Configuration
After restarting, test the configuration:

```bash
# Test the debug endpoint
curl http://localhost:8000/api/debug-keycloak-config

# The response should show the new client secret, not "your-client-secret-here"
```

### Step 3: Test Token Validation
After restarting, test the token validation:

```bash
# Get a token from frontend (login through the UI)
# Then test the validation endpoint
curl -X POST http://localhost:8000/api/validate-keycloak-token \
  -H "Authorization: Bearer YOUR_FRONTEND_TOKEN" \
  -H "Content-Type: application/json"
```

### Step 4: Check Laravel Cache (if needed)
If the configuration still doesn't update, clear Laravel's config cache:

```bash
cd backend
php artisan config:clear
php artisan config:cache
php artisan cache:clear
```

## Expected Results
After restarting the backend:
- ✅ **Debug endpoint shows new client secret**
- ✅ **Token validation works**
- ✅ **No more 401 errors**

## Troubleshooting
If you still get 401 errors after restart:

1. **Verify the .env file** has the correct secret
2. **Check for typos** in the client secret
3. **Ensure no extra spaces** around the secret
4. **Check Laravel logs** for specific error messages
5. **Test the client secret directly** with Keycloak

## Quick Test Commands
```bash
# Test client secret with Keycloak
curl -X POST http://localhost:8080/realms/dasm-platform/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=dasm-backend&client_secret=89YPkROWWw36k9CSq8A4t29YkSE2heL6"

# Test backend configuration
curl http://localhost:8000/api/debug-keycloak-config
```

The key is to **restart the backend** so it picks up the new environment variables!

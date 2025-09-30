# Keycloak Quick Setup
### Step 1: Start Keycloak with Docker

```bash
# Create and start Keycloak
docker run -d \
  --name keycloak \
  -p 8080:8080 \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=admin123 \
  quay.io/keycloak/keycloak:latest \
  start-dev
```

### Step 2: Wait for Keycloak to Start

```bash
# Wait for Keycloak to be ready (about 30-60 seconds)
curl -f http://localhost:8080/health/ready || echo "Still starting..."
```

### Step 3: Access Admin Console

1. Go to: http://localhost:8080
2. Click "Administration Console"
3. Login with: `admin` / `admin123`

### Step 4: Create Realm

1. Click the dropdown in top-left (shows "Master")
2. Click "Create Realm"
3. Enter: `dasm-platform`
4. Click "Create"

### Step 5: Create Backend Client

1. Go to "Clients" → "Create client"
2. **Client ID**: `dasm-backend`
3. Click "Next"
4. **Client authentication**: `ON`
5. **Service accounts roles**: `ON`
6. **Direct access grants**: `ON`
7. Click "Save"
8. Go to "Credentials" tab
9. Copy the "Client secret"

### Step 6: Update Backend .env

Add to your `backend/.env` file:

```env
KEYCLOAK_SERVER_URL=http://localhost:8080
KEYCLOAK_REALM=dasm-platform
KEYCLOAK_CLIENT_ID=dasm-backend
KEYCLOAK_CLIENT_SECRET=your-copied-secret-here
```

### Step 7: Create Roles

1. Go to "Clients" → `dasm-backend` → "Roles"
2. Create these roles:
   - `admin`
   - `moderator`
   - `venue_owner`
   - `investor`
   - `dealer`
   - `user`

### Step 8: Test Setup

```bash
cd backend
php artisan migrate:users-to-keycloak --dry-run
```

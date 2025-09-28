# Keycloak Environment Configuration

## Backend Environment Variables

Add these variables to your `backend/.env` file:

```env
# Keycloak Configuration
KEYCLOAK_SERVER_URL=http://localhost:8080
KEYCLOAK_REALM=master
KEYCLOAK_CLIENT_ID=dasm-platform
KEYCLOAK_CLIENT_SECRET=your-client-secret-here

# Update auth guard to use Keycloak (optional - defaults to 'web')
AUTH_GUARD=keycloak
```

## Frontend Environment Variables

Add these variables to your `frontend/.env.local` file:

```env
# Keycloak Configuration
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080
NEXT_PUBLIC_KEYCLOAK_REALM=master
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=dasm-platform

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Environment Variable Descriptions

### Backend Variables

- **KEYCLOAK_SERVER_URL**: The URL where your Keycloak server is running
- **KEYCLOAK_REALM**: The Keycloak realm name (usually 'master' for development)
- **KEYCLOAK_CLIENT_ID**: The client ID configured in Keycloak
- **KEYCLOAK_CLIENT_SECRET**: The client secret (if using confidential client)
- **AUTH_GUARD**: Set to 'keycloak' to use Keycloak authentication

### Frontend Variables

- **NEXT_PUBLIC_KEYCLOAK_URL**: The URL where your Keycloak server is running (must be public)
- **NEXT_PUBLIC_KEYCLOAK_REALM**: The Keycloak realm name (must be public)
- **NEXT_PUBLIC_KEYCLOAK_CLIENT_ID**: The client ID configured in Keycloak (must be public)
- **NEXT_PUBLIC_API_URL**: The URL of your Laravel backend API

## Setup Steps

1. **Create Backend .env file**:
   ```bash
   cd backend
   cp .env.example .env  # or create new .env file
   ```

2. **Add Keycloak variables to backend/.env**:
   ```env
   KEYCLOAK_SERVER_URL=http://localhost:8080
   KEYCLOAK_REALM=master
   KEYCLOAK_CLIENT_ID=dasm-platform
   KEYCLOAK_CLIENT_SECRET=your-client-secret-here
   AUTH_GUARD=keycloak
   ```

3. **Create Frontend .env.local file**:
   ```bash
   cd frontend
   touch .env.local
   ```

4. **Add Keycloak variables to frontend/.env.local**:
   ```env
   NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080
   NEXT_PUBLIC_KEYCLOAK_REALM=master
   NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=dasm-platform
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

## Keycloak Server Setup

Before using these environment variables, make sure your Keycloak server is configured:

1. **Start Keycloak**:
   ```bash
   docker run -p 8080:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:latest start-dev
   ```

2. **Access Admin Console**: http://localhost:8080

3. **Create/Configure Client**:
   - Client ID: `dasm-platform`
   - Client Protocol: `openid-connect`
   - Access Type: `public` (for SPA) or `confidential` (for backend)
   - Valid Redirect URIs: `http://localhost:3000/*`
   - Web Origins: `http://localhost:3000`
   - Enable "Direct Access Grants Enabled" for ROPC flow

4. **Create Roles**:
   - `admin`
   - `dealer`
   - `moderator`
   - `venue_owner`
   - `investor`
   - `user`

5. **Create Test Users** with appropriate roles

## Production Configuration

For production, update the URLs to your actual domains:

```env
# Backend
KEYCLOAK_SERVER_URL=https://your-keycloak-domain.com
KEYCLOAK_REALM=your-production-realm
KEYCLOAK_CLIENT_ID=dasm-platform
KEYCLOAK_CLIENT_SECRET=your-production-client-secret

# Frontend
NEXT_PUBLIC_KEYCLOAK_URL=https://your-keycloak-domain.com
NEXT_PUBLIC_KEYCLOAK_REALM=your-production-realm
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=dasm-platform
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

## Security Notes

- Never commit `.env` files to version control
- Use strong client secrets in production
- Configure proper CORS settings in Keycloak
- Use HTTPS in production
- Regularly rotate client secrets

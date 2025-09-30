// Keycloak Configuration
export const keycloakConfig = {
  url: process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080',
  realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'dasm-platform',
  clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'dasm-frontend',
};

// API Configuration
export const apiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
};

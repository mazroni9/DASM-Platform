import Keycloak from 'keycloak-js';
import { keycloakConfig } from './config';

// Initialize Keycloak instance
const keycloak = new Keycloak(keycloakConfig);

// Keycloak service class
class KeycloakService {
  private static instance: KeycloakService;
  private keycloak: Keycloak;
  private isInitialized = false;

  private constructor() {
    this.keycloak = keycloak;
  }

  public static getInstance(): KeycloakService {
    if (!KeycloakService.instance) {
      KeycloakService.instance = new KeycloakService();
    }
    return KeycloakService.instance;
  }

  /**
   * Initialize Keycloak
   */
  public async init(): Promise<boolean> {
    // Check if we're on client side
    if (typeof window === 'undefined') {
      return false;
    }

    if (this.isInitialized) {
      return this.keycloak.authenticated || false;
    }

    try {
      // Simple initialization for ROPC flow - no SSO checks needed
      const authenticated = await this.keycloak.init({
        onLoad: 'check-sso',
        checkLoginIframe: false,
        enableLogging: true,
        // Disable silent SSO to avoid CSP frame-ancestor violations
        silentCheckSsoRedirectUri: false,
      });

      this.isInitialized = true;
      return authenticated;
    } catch (error: any) {
      console.error('Keycloak initialization failed:', error);
      console.error('Keycloak config:', keycloakConfig);
      
      // Mark as initialized even if failed to prevent retry loops
      this.isInitialized = true;
      return false;
    }
  }

  /**
   * Login with username and password (ROPC flow)
   */
  public async loginWithPassword(username: string, password: string): Promise<boolean> {
    try {
      // Use direct HTTP request for ROPC flow instead of Keycloak JS library
      const tokenUrl = `${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/token`;
      
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'password',
          client_id: keycloakConfig.clientId,
          username: username,
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error_description || errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const tokenData = await response.json();
      
      // Store tokens in Keycloak instance for compatibility
      if (this.keycloak) {
        this.keycloak.token = tokenData.access_token;
        this.keycloak.refreshToken = tokenData.refresh_token;
        this.keycloak.idToken = tokenData.id_token;
        this.keycloak.authenticated = true;
        
        // Parse token for user info
        if (tokenData.access_token) {
          try {
            const payload = JSON.parse(atob(tokenData.access_token.split('.')[1]));
            this.keycloak.tokenParsed = payload;
          } catch (e) {
            console.warn('Failed to parse access token:', e);
          }
        }
      }

      return true;
    } catch (error: any) {
      console.error('Keycloak login failed:', error);
      
      // Provide more specific error information
      if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('فشل في تسجيل الدخول. يرجى التحقق من البيانات والمحاولة مرة أخرى.');
      }
    }
  }

  /**
   * Login with redirect (PKCE flow)
   */
  public async loginWithRedirect(): Promise<void> {
    try {
      await this.keycloak.login({
        redirectUri: window.location.origin + '/dashboard',
      });
    } catch (error) {
      console.error('Keycloak redirect login failed:', error);
      throw error;
    }
  }

  /**
   * Logout
   */
  public async logout(): Promise<void> {
    try {
      await this.keycloak.logout({
        redirectUri: window.location.origin + '/auth/login',
      });
    } catch (error) {
      console.error('Keycloak logout failed:', error);
      throw error;
    }
  }

  /**
   * Get access token
   */
  public getAccessToken(): string | undefined {
    if (!this.isInitialized || !this.keycloak) {
      return undefined;
    }
    return this.keycloak.token;
  }

  /**
   * Get refresh token
   */
  public getRefreshToken(): string | undefined {
    if (!this.isInitialized || !this.keycloak) {
      return undefined;
    }
    return this.keycloak.refreshToken;
  }

  /**
   * Get ID token
   */
  public getIdToken(): string | undefined {
    if (!this.isInitialized || !this.keycloak) {
      return undefined;
    }
    return this.keycloak.idToken;
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    if (!this.isInitialized || !this.keycloak) {
      return false;
    }
    return this.keycloak.authenticated || false;
  }

  /**
   * Check if Keycloak is initialized
   */
  public isReady(): boolean {
    return this.isInitialized && !!this.keycloak;
  }

  /**
   * Reset Keycloak instance (for debugging)
   */
  public reset(): void {
    this.isInitialized = false;
    this.keycloak = new Keycloak(keycloakConfig);
  }

  /**
   * Get user info
   */
  public getUserInfo(): any {
    return this.keycloak.tokenParsed;
  }

  /**
   * Get user roles
   */
  public getUserRoles(): string[] {
    return this.keycloak.realmAccess?.roles || [];
  }

  /**
   * Get client roles
   */
  public getClientRoles(): string[] {
    const clientId = keycloakConfig.clientId;
    return this.keycloak.resourceAccess?.[clientId]?.roles || [];
  }

  /**
   * Check if user has role
   */
  public hasRole(role: string): boolean {
    const realmRoles = this.getUserRoles();
    const clientRoles = this.getClientRoles();
    return realmRoles.includes(role) || clientRoles.includes(role);
  }

  /**
   * Refresh token
   */
  public async refreshToken(): Promise<boolean> {
    try {
      const refreshed = await this.keycloak.updateToken(30); // Refresh if expires in 30 seconds
      return refreshed;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  /**
   * Get token expiration time
   */
  public getTokenExpiration(): number | undefined {
    if (this.keycloak.tokenParsed?.exp) {
      return this.keycloak.tokenParsed.exp * 1000; // Convert to milliseconds
    }
    return undefined;
  }

  /**
   * Check if token is expired
   */
  public isTokenExpired(): boolean {
    const expiration = this.getTokenExpiration();
    if (!expiration) return true;
    return Date.now() >= expiration;
  }

  /**
   * Get user profile
   */
  public async getUserProfile(): Promise<any> {
    try {
      return await this.keycloak.loadUserProfile();
    } catch (error) {
      console.error('Failed to load user profile:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const keycloakService = KeycloakService.getInstance();
export default keycloakService;

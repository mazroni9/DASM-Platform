import { useAuthStore } from "@/store/authStore";

/**
 * Utility functions for role-based access control
 */

/**
 * Check if the current user has a specific Keycloak role
 * @param role - The role to check for
 * @returns boolean - true if user has the role, false otherwise
 */
export function hasKeycloakRole(role: string): boolean {
  const { user } = useAuthStore.getState();
  return user?.keycloak_roles?.includes(role) || false;
}

/**
 * Check if the current user has any of the specified Keycloak roles
 * @param roles - Array of roles to check for
 * @returns boolean - true if user has any of the roles, false otherwise
 */
export function hasAnyKeycloakRole(roles: string[]): boolean {
  const { user } = useAuthStore.getState();
  if (!user?.keycloak_roles) return false;
  
  return roles.some(role => user.keycloak_roles.includes(role));
}

/**
 * Check if the current user has all of the specified Keycloak roles
 * @param roles - Array of roles to check for
 * @returns boolean - true if user has all of the roles, false otherwise
 */
export function hasAllKeycloakRoles(roles: string[]): boolean {
  const { user } = useAuthStore.getState();
  if (!user?.keycloak_roles) return false;
  
  return roles.every(role => user.keycloak_roles.includes(role));
}

/**
 * Get all Keycloak roles for the current user
 * @returns string[] - Array of user's Keycloak roles
 */
export function getUserKeycloakRoles(): string[] {
  const { user } = useAuthStore.getState();
  return user?.keycloak_roles || [];
}

/**
 * Check if the current user has a specific application role
 * @param role - The application role to check for
 * @returns boolean - true if user has the role, false otherwise
 */
export function hasApplicationRole(role: string): boolean {
  const { user } = useAuthStore.getState();
  return user?.role === role;
}

/**
 * React hook for checking Keycloak roles
 * @param role - The role to check for
 * @returns boolean - true if user has the role, false otherwise
 */
export function useHasKeycloakRole(role: string): boolean {
  const { user } = useAuthStore();
  return user?.keycloak_roles?.includes(role) || false;
}

/**
 * React hook for checking multiple Keycloak roles
 * @param roles - Array of roles to check for
 * @param requireAll - If true, user must have all roles. If false, user needs any role.
 * @returns boolean - true if user meets the role requirements
 */
export function useHasKeycloakRoles(roles: string[], requireAll: boolean = false): boolean {
  const { user } = useAuthStore();
  if (!user?.keycloak_roles) return false;
  
  if (requireAll) {
    return roles.every(role => user.keycloak_roles.includes(role));
  } else {
    return roles.some(role => user.keycloak_roles.includes(role));
  }
}

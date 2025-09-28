"use client";

import { useAuthStore } from "@/store/authStore";
import { useHasKeycloakRole } from "@/lib/roleUtils";

export default function TestKcRolesWidget() {
  const { user } = useAuthStore();
  const hasTestKcRole = useHasKeycloakRole('test-kc-roles');

  // Don't render if user doesn't have the required role
  if (!hasTestKcRole) {
    return null;
  }

  return (
    <div className="bg-gray-100 border border-gray-300 rounded p-4 mb-6">
      <h3 className="text-lg font-semibold mb-3">Keycloak User Information</h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <strong>User ID:</strong> {user?.id}
        </div>
        <div>
          <strong>Email:</strong> {user?.email}
        </div>
        <div>
          <strong>Name:</strong> {user?.first_name} {user?.last_name}
        </div>
        <div>
          <strong>Application Role:</strong> {user?.role}
        </div>
        <div>
          <strong>Keycloak UUID:</strong> {user?.keycloak_uuid}
        </div>
        <div>
          <strong>Keycloak Roles:</strong> {user?.keycloak_roles?.join(', ')}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useAuthStore } from "@/store/authStore";

interface UserRolesDisplayProps {
  className?: string;
}

export default function UserRolesDisplay({ className = "" }: UserRolesDisplayProps) {
  const { user } = useAuthStore();

  if (!user || !user.keycloak_roles || user.keycloak_roles.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-3">
        🔐 Keycloak Roles
      </h3>
      
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {user.keycloak_roles.map((role, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200"
            >
              {role}
            </span>
          ))}
        </div>
      </div>
      
      <div className="mt-3 text-sm text-gray-600">
        <p><strong>Application Role:</strong> {user.role}</p>
        <p><strong>Total Keycloak Roles:</strong> {user.keycloak_roles.length}</p>
      </div>
    </div>
  );
}

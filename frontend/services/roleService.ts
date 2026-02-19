import api from "@/lib/axios";

export interface Permission {
  id: number;
  name: string;
  display_name?: string;
  module?: string;
}

export interface Role {
  id: number;
  name: string;
  display_name?: string;
  description?: string;
  guard_name: string;
  created_at: string;
  updated_at: string;
  users_count?: number;
  permissions_count?: number;
  permissions?: Permission[];
}

export interface GroupedPermissions {
  [module: string]: Permission[];
}

interface CreateRoleData {
  name: string;
  display_name: string;
  description?: string;
  permission_ids: number[];
}

interface UpdateRoleData {
  name: string;
  display_name: string;
  description?: string;
  permission_ids: number[];
}

export const roleService = {
  async getRoles(): Promise<Role[]> {
    const response = await api.get("/api/admin/roles");
    return response.data.data;
  },

  async getRole(id: number | string): Promise<Role> {
    const response = await api.get(`/api/admin/roles/${id}`);
    return response.data.data;
  },

  async createRole(data: CreateRoleData): Promise<Role> {
    const response = await api.post("/api/admin/roles", data);
    return response.data.data;
  },

  async updateRole(id: number | string, data: UpdateRoleData): Promise<Role> {
    const response = await api.put(`/api/admin/roles/${id}`, data);
    return response.data.data;
  },

  async deleteRole(id: number | string): Promise<void> {
    await api.delete(`/api/admin/roles/${id}`);
  },

  async getPermissionsTree(): Promise<GroupedPermissions> {
    const response = await api.get("/api/admin/permissions/tree");
    return response.data.data;
  },
};

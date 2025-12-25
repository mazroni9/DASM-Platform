import api from "@/lib/axios";

export const subscriptionPlanService = {
  async list(params = {}) {
    const { data } = await api.get("/api/admin/subscription-plans", { params });
    return data;
  },
  async create(payload) {
    const { data } = await api.post("/api/admin/subscription-plans", payload);
    return data;
  },
  async get(id) {
    const { data } = await api.get(`/api/admin/subscription-plans/${id}`);
    return data;
  },
  async update(id, payload) {
    const { data } = await api.put(`/api/admin/subscription-plans/${id}`, payload);
    return data;
  },
  async remove(id) {
    const { data } = await api.delete(`/api/admin/subscription-plans/${id}`);
    return data;
  },
  async toggleStatus(id) {
    const { data } = await api.post(`/api/admin/subscription-plans/${id}/toggle-status`);
    return data;
  },
  async getByUserType(userType) {
    const { data } = await api.get(`/api/subscription-plans/user-type/${userType}`);
    return data;
  },
};

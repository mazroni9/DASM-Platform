import api from "@/lib/axios";

export const commissionTierService = {
  async list() {
    const { data } = await api.get("/api/admin/commission-tiers");
    return data;
  },
  async create(payload) {
    const { data } = await api.post("/api/admin/commission-tiers", payload);
    return data;
  },
  async get(id) {
    const { data } = await api.get(`/api/admin/commission-tiers/${id}`);
    return data;
  },
  async update(id, payload) {
    const { data } = await api.put(`/api/admin/commission-tiers/${id}`, payload);
    return data;
  },
  async remove(id) {
    const { data } = await api.delete(`/api/admin/commission-tiers/${id}`);
    return data;
  },
  async calculate(price) {
    const { data } = await api.post(`/api/admin/commission-tiers/calculate`, { price });
    return data;
  },
};



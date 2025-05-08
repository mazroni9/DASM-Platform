// ملف: lib/axios.ts

import axios from "axios";
import { useAuthStore } from "@/store/authStore";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // إذا كان الخطأ Unauthorized نحاول نرجع المستخدم لتسجيل الدخول
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // ❌ تم تعليق الكود التالي لأن refreshToken غير معرف حاليا في AuthState
      // const refreshSuccess = await useAuthStore.getState().refreshToken();
      // if (refreshSuccess) {
      //   return api(originalRequest);
      // }

      // TODO: في المستقبل، إذا أضفت خاصية refreshToken في المتجر، أعد تنشيط هذا الكود
    }

    return Promise.reject(error);
  }
);

export default api;

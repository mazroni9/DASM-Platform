// محدث خدمة OBS للتكامل مع الواجهة الخلفية والمصادقة
// يوفر واجهة للتفاعل مع الواجهة الخلفية وإدارة المصادقة للبث المباشر

import { getOBSService, OBSService } from "./obsService";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";

/**
 * خدمة إدارة OBS للتكامل مع الواجهة الخلفية
 */
export class BackendOBSService {
  private obsService: OBSService;
  private pollInterval: NodeJS.Timeout | null = null;
  private broadcastInfo: any = null;

  /**
   * إنشاء خدمة تكامل OBS جديدة
   */
  constructor() {
    const storedSettings = this.loadOBSSettings();
    this.obsService = getOBSService(
      storedSettings.ip || "localhost",
      storedSettings.port || 4455,
      storedSettings.password || ""
    );
  }

  /**
   * تحميل إعدادات OBS المخزنة محلياً
   */
  private loadOBSSettings(): { ip: string; port: number; password: string } {
    if (typeof window === "undefined") {
      return { ip: "localhost", port: 4455, password: "" };
    }

    try {
      const storedSettings = localStorage.getItem("obs-settings");
      if (storedSettings) {
        return JSON.parse(storedSettings);
      }
    } catch (error) {
      console.error("خطأ في تحميل إعدادات OBS:", error);
    }

    return { ip: "localhost", port: 4455, password: "" };
  }

  /**
   * حفظ إعدادات OBS محلياً
   */
  saveOBSSettings(ip: string, port: number, password: string): void {
    try {
      localStorage.setItem(
        "obs-settings",
        JSON.stringify({ ip, port, password })
      );
    } catch (error) {
      console.error("خطأ في حفظ إعدادات OBS:", error);
    }
  }

  /**
   * الاتصال بـ OBS وجلب معلومات البث من الواجهة الخلفية
   */
  async connect(ip: string, port: number, password: string): Promise<boolean> {
    // حفظ الإعدادات الجديدة
    this.saveOBSSettings(ip, port, password);

    try {
      // محاولة الاتصال بـ OBS
      const connected = await this.obsService.connect();

      if (connected) {
        console.log("تم الاتصال بـ OBS Studio بنجاح");

        // جلب معلومات البث الحالي
        await this.fetchBroadcastInfo();

        // بدء مراقبة حالة البث
        this.startPolling();

        return true;
      } else {
        console.error("فشل الاتصال بـ OBS Studio");
        return false;
      }
    } catch (error) {
      console.error("خطأ أثناء الاتصال بـ OBS:", error);
      return false;
    }
  }

  /**
   * إغلاق الاتصال وإيقاف المراقبة
   */
  async disconnect(): Promise<boolean> {
    try {
      // إيقاف مراقبة حالة البث
      this.stopPolling();

      // إذا كان البث نشطًا، قم بتحديث حالة البث في الخادم
      if (this.obsService.isStreaming() && this.broadcastInfo) {
        await this.updateStreamingState(false);
      }

      // قطع الاتصال بـ OBS
      this.obsService.getOBSWebSocket().disconnect();

      return true;
    } catch (error) {
      console.error("خطأ أثناء قطع الاتصال بـ OBS:", error);
      return false;
    }
  }

  /**
   * بدء مراقبة حالة البث والمزادات
   */
  private startPolling(): void {
    // تنظيف أي مؤقت سابق
    this.stopPolling();

    // بدء مراقبة كل 5 ثوانٍ
    this.pollInterval = setInterval(() => {
      this.checkBroadcastStatus();
    }, 5000);
  }

  /**
   * إيقاف مراقبة حالة البث
   */
  private stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  /**
   * جلب معلومات البث من الخادم
   */
  private async fetchBroadcastInfo(): Promise<boolean> {
    try {
      const response = await api.get("/api/broadcast");

      if (response.data.status === "success") {
        this.broadcastInfo = response.data.data;
        return true;
      }

      return false;
    } catch (error) {
      console.error("خطأ في جلب معلومات البث:", error);
      return false;
    }
  }

  /**
   * التحقق من حالة البث وتحديث الواجهة الخلفية
   */
  private async checkBroadcastStatus(): Promise<void> {
    // التحقق من الاتصال بـ OBS
    if (!this.obsService.isConnected()) {
      return;
    }

    try {
      // الحصول على حالة البث من OBS
      const isStreaming = this.obsService.isStreaming();

      // جلب معلومات البث من الخادم
      await this.fetchBroadcastInfo();

      // إذا كان البث جارياً في OBS ولكن ليس في الخادم، أو العكس، قم بالتحديث
      if (this.broadcastInfo && isStreaming !== this.broadcastInfo.is_live) {
        await this.updateStreamingState(isStreaming);
      }
    } catch (error) {
      console.error("خطأ في التحقق من حالة البث:", error);
    }
  }

  /**
   * تحديث حالة البث في الخادم
   */
  private async updateStreamingState(isLive: boolean): Promise<void> {
    // فقط المدير يمكنه تغيير حالة البث
    // لذلك هذه الوظيفة ستستخدم فقط لتوثيق حالة البث المحلية
    try {
      // تسجيل حالة البث الجديدة
      console.log(`تغير حالة البث: ${isLive ? "نشط" : "متوقف"}`);

      // يمكن إضافة إشعارات أو تحديثات محلية هنا
    } catch (error) {
      console.error("خطأ في تحديث حالة البث:", error);
    }
  }

  /**
   * بدء البث المباشر
   */
  async startStreaming(): Promise<boolean> {
    if (!this.obsService.isConnected()) {
      console.warn("غير متصل بـ OBS، لا يمكن بدء البث");
      return false;
    }

    if (!this.broadcastInfo) {
      console.warn("لم يتم العثور على معلومات البث، جاري التحديث...");
      const fetched = await this.fetchBroadcastInfo();
      if (!fetched || !this.broadcastInfo) {
        console.error("لم يتم العثور على بث مكون من قبل المدير");
        return false;
      }
    }

    try {
      // التحقق من المصادقة قبل بدء البث
      const authStore = useAuthStore.getState();
      if (!authStore.isLoggedIn || !authStore.token) {
        console.error("يجب تسجيل الدخول لبدء البث");
        return false;
      }

      // قد نحتاج لإعداد معلومات البث في OBS أولاً
      if (this.broadcastInfo.rtmp_url && this.broadcastInfo.stream_key) {
        // هنا يمكن إضافة كود لتكوين إعدادات البث في OBS إذا كان SDK يدعم ذلك
      }

      // بدء البث في OBS
      const result = await this.obsService.startStreaming();

      if (result) {
        console.log(`تم بدء البث`);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("خطأ في بدء البث:", error);
      return false;
    }
  }

  /**
   * إيقاف البث المباشر
   */
  async stopStreaming(): Promise<boolean> {
    if (!this.obsService.isConnected()) {
      console.warn("غير متصل بـ OBS، لا يمكن إيقاف البث");
      return false;
    }

    try {
      // التحقق من المصادقة قبل إيقاف البث
      const authStore = useAuthStore.getState();
      if (!authStore.isLoggedIn || !authStore.token) {
        console.error("يجب تسجيل الدخول لإيقاف البث");
        return false;
      }

      // إيقاف البث في OBS
      const result = await this.obsService.stopStreaming();

      if (result) {
        console.log("تم إيقاف البث");
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("خطأ في إيقاف البث:", error);
      return false;
    }
  }

  /**
   * الحصول على حالة البث
   */
  isStreaming(): boolean {
    return this.obsService.isStreaming();
  }

  /**
   * الحصول على حالة الاتصال
   */
  isConnected(): boolean {
    return this.obsService.isConnected();
  }

  /**
   * الحصول على معلومات البث الحالي
   */
  getBroadcastInfo(): any {
    return this.broadcastInfo;
  }

  /**
   * الحصول على خدمة OBS الأساسية
   */
  getOBSService(): OBSService {
    return this.obsService;
  }
}

// كائن singleton للاستخدام في جميع أنحاء التطبيق
let backendOBSServiceInstance: BackendOBSService | null = null;

/**
 * الحصول على مثيل خدمة تكامل OBS مع الواجهة الخلفية
 */
export function getBackendOBSService(): BackendOBSService {
  if (!backendOBSServiceInstance) {
    backendOBSServiceInstance = new BackendOBSService();
  }
  return backendOBSServiceInstance;
}

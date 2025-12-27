// مكتبة التكامل مع OBS WebSocket
// توفر هذه المكتبة وظائف للاتصال بـ OBS Studio عبر بروتوكول WebSocket

import { EventEmitter } from 'events';

/**
 * فئة لإدارة الاتصال بـ OBS Studio عبر WebSocket
 */
export class OBSWebSocket extends EventEmitter {
  private socket: WebSocket | null = null;
  private connected: boolean = false;
  private messageId: number = 1;
  private callbacks: Map<number, (response: any) => void> = new Map();
  private reconnectInterval: number = 5000; // محاولة إعادة الاتصال كل 5 ثوانٍ
  private reconnectTimeout: NodeJS.Timeout | null = null;

  // إعدادات الاتصال
  private readonly url: string;
  private readonly password: string;

  /**
   * إنشاء كائن جديد للاتصال بـ OBS
   * @param ip عنوان IP للخادم (الافتراضي localhost)
   * @param port رقم المنفذ (الافتراضي 4455)
   * @param password كلمة المرور للاتصال
   */
  constructor(
    ip: string = 'localhost',
    port: number = 4455,
    password: string = ''
  ) {
    super();
    this.url = `ws://${ip}:${port}`;
    this.password = password;
  }

  /**
   * إنشاء اتصال بـ OBS Studio
   */
  async connect(): Promise<boolean> {
    if (this.connected) {
      return true;
    }

    try {
      return new Promise((resolve, reject) => {
        this.socket = new WebSocket(this.url);

        this.socket.onopen = () => {
          this.emit('connecting');
          // بمجرد فتح الاتصال، نرسل معلومات المصادقة
          this.authenticate();
        };

        this.socket.onmessage = (event) => {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        };

        this.socket.onerror = (error) => {
          console.error('خطأ في اتصال OBS WebSocket:', error);
          this.emit('error', error);
          reject(error);
        };

        this.socket.onclose = () => {
          this.connected = false;
          this.emit('disconnected');
          this.scheduleReconnect();
          resolve(false);
        };
      });
    } catch (error) {
      console.error('فشل الاتصال بـ OBS:', error);
      this.scheduleReconnect();
      return false;
    }
  }

  /**
   * المصادقة مع خادم OBS WebSocket
   */
  private authenticate(): void {
    this.send('GetAuthRequired', {}).then((response) => {
      if (response.authRequired) {
        // إذا كانت المصادقة مطلوبة، نرسل كلمة المرور
        this.send('Authenticate', { auth: this.password }).then(() => {
          this.connected = true;
          this.emit('connected');
        }).catch((error) => {
          this.emit('auth-error', error);
        });
      } else {
        // إذا لم تكن المصادقة مطلوبة، نكون متصلين بالفعل
        this.connected = true;
        this.emit('connected');
      }
    }).catch((error) => {
      this.emit('auth-error', error);
    });
  }

  /**
   * إغلاق الاتصال بـ OBS
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
    }
    this.connected = false;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  /**
   * جدولة إعادة الاتصال عند الانقطاع
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    this.reconnectTimeout = setTimeout(() => {
      this.emit('reconnecting');
      this.connect();
    }, this.reconnectInterval);
  }

  /**
   * إرسال أمر إلى OBS
   * @param requestType نوع الطلب (الأمر)
   * @param requestData البيانات المرفقة مع الطلب
   * @returns وعد بالاستجابة
   */
  send(requestType: string, requestData: any = {}): Promise<any> {
    if (!this.connected || !this.socket) {
      return Promise.reject(new Error('غير متصل بـ OBS'));
    }

    const messageId = this.messageId++;
    
    // إنشاء كائن الطلب
    const request = {
      'request-type': requestType,
      'message-id': messageId.toString(),
      ...requestData
    };

    return new Promise((resolve, reject) => {
      // تخزين معالج الاستجابة
      this.callbacks.set(messageId, (response) => {
        if (response.status === 'ok') {
          resolve(response);
        } else {
          reject(new Error(response.error));
        }
      });

      // إرسال الطلب
      this.socket!.send(JSON.stringify(request));
      
      // إلغاء الطلب بعد مهلة (10 ثوانٍ)
      setTimeout(() => {
        if (this.callbacks.has(messageId)) {
          this.callbacks.delete(messageId);
          reject(new Error('انتهت مهلة الطلب'));
        }
      }, 10000);
    });
  }

  /**
   * معالجة الرسائل الواردة من OBS
   * @param message الرسالة الواردة
   */
  private handleMessage(message: any): void {
    // التحقق من وجود معرف رسالة للاستجابة
    if (message['message-id']) {
      const messageId = parseInt(message['message-id']);
      const callback = this.callbacks.get(messageId);
      
      if (callback) {
        // استدعاء معالج الاستجابة
        callback(message);
        this.callbacks.delete(messageId);
      }
    }
    
    // التعامل مع الأحداث
    if (message['update-type']) {
      this.emit(message['update-type'], message);
    }
  }

  /**
   * الحصول على قائمة المشاهد في OBS
   */
  async getScenes(): Promise<any> {
    return this.send('GetSceneList');
  }

  /**
   * تغيير المشهد الحالي
   * @param sceneName اسم المشهد
   */
  async setCurrentScene(sceneName: string): Promise<any> {
    return this.send('SetCurrentScene', { 'scene-name': sceneName });
  }

  /**
   * بدء البث
   */
  async startStreaming(): Promise<any> {
    return this.send('StartStreaming');
  }

  /**
   * إيقاف البث
   */
  async stopStreaming(): Promise<any> {
    return this.send('StopStreaming');
  }

  /**
   * الحصول على حالة البث
   */
  async getStreamingStatus(): Promise<any> {
    return this.send('GetStreamingStatus');
  }

  /**
   * تحديث معلومات مصدر نصي
   * @param sourceName اسم المصدر
   * @param text النص الجديد
   */
  async setSourceText(sourceName: string, text: string): Promise<any> {
    return this.send('SetTextGDIPlusProperties', {
      'source': sourceName,
      'text': text
    });
  }
}

// كائن singleton للاستخدام في جميع أنحاء التطبيق
let obsInstance: OBSWebSocket | null = null;

/**
 * الحصول على مثيل OBS WebSocket
 */
export function getOBSInstance(
  ip: string = 'localhost',
  port: number = 4455,
  password: string = ''
): OBSWebSocket {
  if (!obsInstance) {
    obsInstance = new OBSWebSocket(ip, port, password);
  }
  return obsInstance;
} 
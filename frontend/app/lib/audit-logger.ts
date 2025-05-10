/**
 * 📝 نظام تسجيل العمليات للمراجعة
 * 📁 المسار: frontend/app/lib/audit-logger.ts
 *
 * ✅ الوظيفة:
 * - تسجيل جميع عمليات المزادات للمراجعة لاحقاً
 * - تسجيل عمليات المحرّج والمزايدين
 * - تخزين البيانات في قاعدة البيانات
 */

// أنواع الأحداث التي يمكن تسجيلها
export enum AuditEventType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  BID_PLACED = 'bid_placed',
  BID_ACCEPTED = 'bid_accepted',
  BID_REJECTED = 'bid_rejected',
  AUCTION_STARTED = 'auction_started',
  AUCTION_ENDED = 'auction_ended',
  AUCTION_PAUSED = 'auction_paused',
  AUCTION_RESUMED = 'auction_resumed',
  CAR_ADDED = 'car_added',
  CAR_UPDATED = 'car_updated',
  CAR_REMOVED = 'car_removed',
  USER_ADDED = 'user_added',
  USER_UPDATED = 'user_updated',
  USER_REMOVED = 'user_removed',
  SYSTEM_ERROR = 'system_error',
}

// واجهة سجل الأحداث
export interface AuditLogEntry {
  id?: string;
  timestamp: string;
  event_type: AuditEventType;
  user_id?: number;
  user_email?: string;
  user_role?: string;
  resource_id?: number | string;
  resource_type?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

// الفئة الرئيسية لتسجيل الأحداث
export class AuditLogger {
  private static instance: AuditLogger;
  private apiEndpoint: string;
  private pendingLogs: AuditLogEntry[] = [];
  private isSending = false;
  
  private constructor() {
    // تحديد نقطة النهاية للAPI
    this.apiEndpoint = process.env.NEXT_PUBLIC_API_URL 
      ? `${process.env.NEXT_PUBLIC_API_URL}/audit-logs` 
      : 'https://api.dasm-platform.com/audit-logs';
    
    // إرسال السجلات المعلقة عند إغلاق النافذة
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.sendPendingLogs(true);
      });
      
      // إعداد إرسال دوري للسجلات المعلقة كل 30 ثانية
      setInterval(() => {
        this.sendPendingLogs();
      }, 30000);
    }
  }
  
  // الحصول على مثيل واحد (نمط Singleton)
  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }
  
  // تسجيل حدث جديد
  public log(event: Omit<AuditLogEntry, 'timestamp'>): void {
    // إنشاء سجل جديد مع الطابع الزمني الحالي
    const logEntry: AuditLogEntry = {
      ...event,
      timestamp: new Date().toISOString(),
    };
    
    // إضافة معلومات المتصفح إذا كان متاحاً
    if (typeof window !== 'undefined') {
      logEntry.user_agent = navigator.userAgent;
    }
    
    // إضافة السجل إلى قائمة الانتظار
    this.pendingLogs.push(logEntry);
    
    // محاولة إرسال السجلات إذا لم تكن عملية الإرسال جارية
    if (!this.isSending) {
      this.sendPendingLogs();
    }
    
    // إضافة السجل إلى وحدة التخزين المحلية للنسخ الاحتياطي
    this.saveToLocalStorage(logEntry);
  }
  
  // إرسال السجلات المعلقة إلى الخادم
  private async sendPendingLogs(immediate = false): Promise<void> {
    // إذا لم يكن هناك سجلات معلقة، لا داعي للمتابعة
    if (this.pendingLogs.length === 0 || this.isSending) {
      return;
    }
    
    // تعليم العملية كجارية
    this.isSending = true;
    
    try {
      // نسخ السجلات المعلقة وإفراغ القائمة الأصلية
      const logsToSend = [...this.pendingLogs];
      this.pendingLogs = [];
      
      // في بيئة التطوير، طباعة السجلات في وحدة التحكم فقط
      if (process.env.NODE_ENV === 'development' && !immediate) {
        console.log('تسجيل أحداث المراجعة:', logsToSend);
        this.isSending = false;
        return;
      }
      
      // إرسال السجلات إلى الخادم
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          logs: logsToSend,
          // إذا كان الإرسال فوري (عند إغلاق النافذة)، استخدم sendBeacon بدلاً من fetch
          immediate
        }),
        // لتجنب انتظار الاستجابة عند إغلاق النافذة
        keepalive: immediate
      });
      
      if (!response.ok && !immediate) {
        throw new Error(`فشل في إرسال سجلات المراجعة: ${response.status}`);
      }
      
      // إذا نجح الإرسال، إزالة السجلات من التخزين المحلي
      logsToSend.forEach(log => {
        this.removeFromLocalStorage(log);
      });
    } catch (error) {
      console.error('خطأ في إرسال سجلات المراجعة:', error);
      
      // إعادة السجلات التي لم يتم إرسالها إلى قائمة الانتظار
      this.pendingLogs.push(...this.pendingLogs);
    } finally {
      // إنهاء حالة الإرسال
      this.isSending = false;
    }
  }
  
  // حفظ السجل في التخزين المحلي كنسخة احتياطية
  private saveToLocalStorage(log: AuditLogEntry): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    
    try {
      // الحصول على السجلات الحالية
      const currentLogs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
      
      // إضافة السجل الجديد
      currentLogs.push(log);
      
      // حفظ السجلات مع الاحتفاظ بأحدث 100 سجل فقط
      localStorage.setItem('audit_logs', JSON.stringify(currentLogs.slice(-100)));
    } catch (error) {
      console.error('خطأ في حفظ سجل المراجعة في التخزين المحلي:', error);
    }
  }
  
  // إزالة سجل من التخزين المحلي
  private removeFromLocalStorage(log: AuditLogEntry): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    
    try {
      // الحصول على السجلات الحالية
      const currentLogs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
      
      // إزالة السجل المحدد بواسطة الطابع الزمني
      const updatedLogs = currentLogs.filter(
        (savedLog: AuditLogEntry) => savedLog.timestamp !== log.timestamp
      );
      
      // حفظ السجلات المحدثة
      localStorage.setItem('audit_logs', JSON.stringify(updatedLogs));
    } catch (error) {
      console.error('خطأ في إزالة سجل المراجعة من التخزين المحلي:', error);
    }
  }
}

// دالة مساعدة للوصول السريع لمسجل الأحداث
export function logAuditEvent(event: Omit<AuditLogEntry, 'timestamp'>): void {
  AuditLogger.getInstance().log(event);
}

// مثال للاستخدام:
// 
// import { logAuditEvent, AuditEventType } from '@/app/lib/audit-logger';
// 
// // تسجيل عملية تسجيل دخول
// logAuditEvent({
//   event_type: AuditEventType.LOGIN,
//   user_id: 123,
//   user_email: 'user@example.com',
//   user_role: 'auctioneer',
//   details: { method: 'password' }
// });
// 
// // تسجيل عملية مزايدة
// logAuditEvent({
//   event_type: AuditEventType.BID_PLACED,
//   user_id: 456,
//   user_email: 'bidder@example.com',
//   resource_id: 789,
//   resource_type: 'car',
//   details: { amount: 95000, previous_amount: 92000 }
// }); 
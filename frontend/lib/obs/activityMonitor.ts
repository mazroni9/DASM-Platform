// مكتبة مراقبة نشاط المزايدة والتنبيهات
// تحليل نشاط المزايدة في الوقت الفعلي وتوليد التنبيهات المناسبة

import { EventEmitter } from 'events';

// واجهة نشاط المزايدة
export interface BidActivity {
  venueId: string;
  venueName: string;
  bidTime: Date;
  bidAmount: number;
  previousAmount: number;
  bidderName: string;
  carInfo: {
    id: string;
    make: string;
    model: string;
    year: number;
  };
}

// واجهة إحصائيات المزايدة
export interface VenueActivityStats {
  venueId: string;
  venueName: string;
  totalBids: number;
  lastBidTime: Date | null;
  highestBid: number;
  lowestBid: number;
  averageBid: number;
  bidCountLastMinute: number;
  activityScore: number;
  bidHistory: BidActivity[];
  isActive: boolean;
}

// واجهة التنبيه
export interface ActivityAlert {
  type: 'high-activity' | 'fast-price-increase' | 'new-high-price' | 'ending-soon' | 'no-activity';
  venueId: string;
  venueName: string;
  message: string;
  severity: 'info' | 'warning' | 'urgent';
  timestamp: Date;
  data?: any;
}

// الإعدادات الافتراضية للمراقبة
export interface ActivityMonitorSettings {
  // عتبة النشاط المرتفع (عدد المزايدات في الدقيقة)
  highActivityThreshold: number;
  
  // عتبة زيادة السعر السريعة (النسبة المئوية)
  priceIncreaseThreshold: number;
  
  // الحد الأدنى للسعر المرتفع الجديد
  minHighPriceThreshold: number;
  
  // عتبة وقت الانتهاء (ثانية)
  endingSoonThreshold: number;
  
  // عتبة عدم النشاط (دقيقة)
  noActivityThreshold: number;
  
  // حجم تاريخ المزايدات لكل معرض
  bidHistorySize: number;
  
  // فترة تحديث المراقبة (مللي ثانية)
  updateInterval: number;
}

/**
 * مراقب نشاط المزايدة
 * يحلل نشاط المزايدة في الوقت الفعلي ويولد تنبيهات
 */
export class ActivityMonitor extends EventEmitter {
  private venues: Map<string, VenueActivityStats> = new Map();
  private settings: ActivityMonitorSettings;
  private updateTimer: NodeJS.Timeout | null = null;
  private lastAlerts: Map<string, Date> = new Map();
  
  /**
   * إنشاء مراقب نشاط المزايدة
   * @param settings إعدادات المراقبة (اختياري)
   */
  constructor(settings?: Partial<ActivityMonitorSettings>) {
    super();
    
    // الإعدادات الافتراضية
    this.settings = {
      highActivityThreshold: 5, // 5 مزايدات في الدقيقة تعتبر نشاطًا مرتفعًا
      priceIncreaseThreshold: 10, // 10% زيادة في السعر تعتبر زيادة سريعة
      minHighPriceThreshold: 100000, // 100 ألف ريال يعتبر سعرًا مرتفعًا
      endingSoonThreshold: 60, // 60 ثانية قبل الانتهاء تعتبر انتهاء قريب
      noActivityThreshold: 5, // 5 دقائق بدون نشاط تعتبر عدم نشاط
      bidHistorySize: 20, // احتفظ بآخر 20 مزايدة لكل معرض
      updateInterval: 10000, // تحديث كل 10 ثوانٍ
      ...settings
    };
  }
  
  /**
   * بدء مراقبة نشاط المزايدة
   */
  startMonitoring(): void {
    if (this.updateTimer) {
      this.stopMonitoring();
    }
    
    // تشغيل مؤقت لتحليل النشاط وتوليد التنبيهات بشكل دوري
    this.updateTimer = setInterval(() => {
      this.analyzeActivity();
    }, this.settings.updateInterval);
    
    console.log('بدأت مراقبة نشاط المزايدة');
  }
  
  /**
   * إيقاف مراقبة نشاط المزايدة
   */
  stopMonitoring(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    
    console.log('توقفت مراقبة نشاط المزايدة');
  }
  
  /**
   * إضافة معرض لمراقبة النشاط
   * @param venueId معرّف المعرض
   * @param venueName اسم المعرض
   */
  addVenue(venueId: string, venueName: string): void {
    if (!this.venues.has(venueId)) {
      this.venues.set(venueId, {
        venueId,
        venueName,
        totalBids: 0,
        lastBidTime: null,
        highestBid: 0,
        lowestBid: Number.MAX_VALUE,
        averageBid: 0,
        bidCountLastMinute: 0,
        activityScore: 0,
        bidHistory: [],
        isActive: true
      });
      
      console.log(`تمت إضافة المعرض للمراقبة: ${venueName} (${venueId})`);
    }
  }
  
  /**
   * إزالة معرض من المراقبة
   * @param venueId معرّف المعرض
   */
  removeVenue(venueId: string): void {
    if (this.venues.has(venueId)) {
      this.venues.delete(venueId);
      console.log(`تمت إزالة المعرض من المراقبة: ${venueId}`);
    }
  }
  
  /**
   * تسجيل مزايدة جديدة
   * @param activity نشاط المزايدة
   */
  recordBid(activity: BidActivity): void {
    // الحصول على إحصائيات المعرض أو إنشاء واحدة جديدة
    let venueStats = this.venues.get(activity.venueId);
    
    if (!venueStats) {
      this.addVenue(activity.venueId, activity.venueName);
      venueStats = this.venues.get(activity.venueId)!;
    }
    
    // تحديث وقت آخر مزايدة
    venueStats.lastBidTime = activity.bidTime;
    
    // تحديث عدد المزايدات الإجمالي
    venueStats.totalBids++;
    
    // تحديث أعلى وأدنى مزايدة
    venueStats.highestBid = Math.max(venueStats.highestBid, activity.bidAmount);
    venueStats.lowestBid = Math.min(venueStats.lowestBid, activity.bidAmount);
    
    // تحديث متوسط المزايدة
    const totalAmount = venueStats.averageBid * (venueStats.totalBids - 1) + activity.bidAmount;
    venueStats.averageBid = totalAmount / venueStats.totalBids;
    
    // إضافة المزايدة إلى التاريخ مع المحافظة على الحجم المحدد
    venueStats.bidHistory.unshift(activity);
    if (venueStats.bidHistory.length > this.settings.bidHistorySize) {
      venueStats.bidHistory = venueStats.bidHistory.slice(0, this.settings.bidHistorySize);
    }
    
    // حساب عدد المزايدات في الدقيقة الأخيرة
    const oneMinuteAgo = new Date(Date.now() - 60000);
    venueStats.bidCountLastMinute = venueStats.bidHistory.filter(
      bid => bid.bidTime >= oneMinuteAgo
    ).length;
    
    // حساب درجة النشاط (0-100)
    venueStats.activityScore = this.calculateActivityScore(venueStats);
    
    // تحديث المعرض في الخريطة
    this.venues.set(activity.venueId, venueStats);
    
    // تحليل النشاط للتنبيهات الفورية
    this.checkForImmediateAlerts(activity, venueStats);
    
    // إرسال حدث تحديث الإحصائيات
    this.emit('stats-updated', venueStats);
  }
  
  /**
   * تحليل النشاط لجميع المعارض
   */
  private analyzeActivity(): void {
    const now = new Date();
    
    // تحليل كل معرض
    this.venues.forEach(venueStats => {
      if (!venueStats.isActive) return;
      
      // إعادة حساب عدد المزايدات في الدقيقة الأخيرة
      const oneMinuteAgo = new Date(now.getTime() - 60000);
      venueStats.bidCountLastMinute = venueStats.bidHistory.filter(
        bid => bid.bidTime >= oneMinuteAgo
      ).length;
      
      // إعادة حساب درجة النشاط
      venueStats.activityScore = this.calculateActivityScore(venueStats);
      
      // التحقق من النشاط المرتفع المستمر
      if (
        venueStats.bidCountLastMinute >= this.settings.highActivityThreshold &&
        this.canSendAlert(venueStats.venueId, 'high-activity')
      ) {
        const alert: ActivityAlert = {
          type: 'high-activity',
          venueId: venueStats.venueId,
          venueName: venueStats.venueName,
          message: `نشاط مرتفع في المعرض: ${venueStats.bidCountLastMinute} مزايدة في الدقيقة الأخيرة`,
          severity: 'warning',
          timestamp: now,
          data: {
            bidCount: venueStats.bidCountLastMinute,
            activityScore: venueStats.activityScore
          }
        };
        
        this.emitAlert(alert);
      }
      
      // التحقق من عدم النشاط
      if (venueStats.lastBidTime) {
        const minutesSinceLastBid = (now.getTime() - venueStats.lastBidTime.getTime()) / 60000;
        
        if (
          minutesSinceLastBid >= this.settings.noActivityThreshold &&
          this.canSendAlert(venueStats.venueId, 'no-activity')
        ) {
          const alert: ActivityAlert = {
            type: 'no-activity',
            venueId: venueStats.venueId,
            venueName: venueStats.venueName,
            message: `لم يتم تسجيل أي مزايدة في المعرض منذ ${Math.floor(minutesSinceLastBid)} دقيقة`,
            severity: 'info',
            timestamp: now,
            data: {
              minutesSinceLastBid
            }
          };
          
          this.emitAlert(alert);
        }
      }
    });
  }
  
  /**
   * حساب درجة النشاط (0-100)
   * @param venueStats إحصائيات المعرض
   * @returns درجة النشاط
   */
  private calculateActivityScore(venueStats: VenueActivityStats): number {
    // العوامل المؤثرة في درجة النشاط:
    // 1. عدد المزايدات في الدقيقة الأخيرة (0-50 نقطة)
    // 2. إجمالي عدد المزايدات (0-20 نقطة)
    // 3. وقت آخر مزايدة (0-30 نقطة)
    
    // 1. عدد المزايدات في الدقيقة الأخيرة
    const bidCountScore = Math.min(50, venueStats.bidCountLastMinute * 10);
    
    // 2. إجمالي عدد المزايدات
    const totalBidsScore = Math.min(20, venueStats.totalBids / 2);
    
    // 3. وقت آخر مزايدة
    let recentActivityScore = 0;
    if (venueStats.lastBidTime) {
      const minutesSinceLastBid = (new Date().getTime() - venueStats.lastBidTime.getTime()) / 60000;
      // النشاط الأخير يكون مؤثرًا أكثر إذا كان حديثًا
      recentActivityScore = Math.max(0, 30 - minutesSinceLastBid * 6); // 0 نقطة بعد 5 دقائق
    }
    
    // حساب الدرجة الإجمالية (0-100)
    return Math.round(bidCountScore + totalBidsScore + recentActivityScore);
  }
  
  /**
   * التحقق من التنبيهات الفورية بعد مزايدة جديدة
   * @param activity نشاط المزايدة الجديد
   * @param venueStats إحصائيات المعرض
   */
  private checkForImmediateAlerts(activity: BidActivity, venueStats: VenueActivityStats): void {
    const now = new Date();
    
    // التحقق من زيادة السعر السريعة
    if (activity.previousAmount > 0) {
      const increasePercentage = ((activity.bidAmount - activity.previousAmount) / activity.previousAmount) * 100;
      
      if (
        increasePercentage >= this.settings.priceIncreaseThreshold &&
        this.canSendAlert(venueStats.venueId, 'fast-price-increase')
      ) {
        const alert: ActivityAlert = {
          type: 'fast-price-increase',
          venueId: venueStats.venueId,
          venueName: venueStats.venueName,
          message: `زيادة سريعة في السعر: ${increasePercentage.toFixed(1)}% (${activity.bidAmount.toLocaleString()} ريال)`,
          severity: 'warning',
          timestamp: now,
          data: {
            increasePercentage,
            previousAmount: activity.previousAmount,
            newAmount: activity.bidAmount,
            bidder: activity.bidderName
          }
        };
        
        this.emitAlert(alert);
      }
    }
    
    // التحقق من وصول السعر إلى مستوى مرتفع جديد
    if (
      activity.bidAmount >= this.settings.minHighPriceThreshold &&
      activity.bidAmount >= venueStats.highestBid &&
      this.canSendAlert(venueStats.venueId, 'new-high-price')
    ) {
      const alert: ActivityAlert = {
        type: 'new-high-price',
        venueId: venueStats.venueId,
        venueName: venueStats.venueName,
        message: `تم تسجيل أعلى سعر جديد: ${activity.bidAmount.toLocaleString()} ريال`,
        severity: 'warning',
        timestamp: now,
        data: {
          amount: activity.bidAmount,
          bidder: activity.bidderName,
          carInfo: activity.carInfo
        }
      };
      
      this.emitAlert(alert);
    }
  }
  
  /**
   * إرسال تنبيه بقرب انتهاء المزاد
   * @param venueId معرّف المعرض
   * @param venueName اسم المعرض
   * @param remainingSeconds الثواني المتبقية
   */
  sendEndingSoonAlert(venueId: string, venueName: string, remainingSeconds: number): void {
    if (this.canSendAlert(venueId, 'ending-soon')) {
      const alert: ActivityAlert = {
        type: 'ending-soon',
        venueId,
        venueName,
        message: `المزاد سينتهي قريبًا: ${remainingSeconds} ثانية متبقية`,
        severity: 'urgent',
        timestamp: new Date(),
        data: {
          remainingSeconds
        }
      };
      
      this.emitAlert(alert);
    }
  }
  
  /**
   * التحقق من إمكانية إرسال تنبيه
   * لتجنب تكرار التنبيهات من نفس النوع في وقت قصير
   * @param venueId معرّف المعرض
   * @param alertType نوع التنبيه
   * @returns هل يمكن إرسال التنبيه
   */
  private canSendAlert(venueId: string, alertType: string): boolean {
    const alertKey = `${venueId}:${alertType}`;
    const lastAlertTime = this.lastAlerts.get(alertKey);
    
    if (!lastAlertTime) {
      this.lastAlerts.set(alertKey, new Date());
      return true;
    }
    
    // تجنب تكرار نفس التنبيه خلال فترة زمنية محددة
    const minutesSinceLastAlert = (new Date().getTime() - lastAlertTime.getTime()) / 60000;
    
    // تحديد الفترة الزمنية حسب نوع التنبيه
    let cooldownMinutes = 5; // 5 دقائق افتراضية
    
    switch (alertType) {
      case 'high-activity':
        cooldownMinutes = 3;
        break;
      case 'fast-price-increase':
        cooldownMinutes = 1;
        break;
      case 'new-high-price':
        cooldownMinutes = 1;
        break;
      case 'ending-soon':
        cooldownMinutes = 0.5;
        break;
      case 'no-activity':
        cooldownMinutes = 10;
        break;
    }
    
    if (minutesSinceLastAlert >= cooldownMinutes) {
      this.lastAlerts.set(alertKey, new Date());
      return true;
    }
    
    return false;
  }
  
  /**
   * إرسال تنبيه
   * @param alert التنبيه
   */
  private emitAlert(alert: ActivityAlert): void {
    this.emit('alert', alert);
  }
  
  /**
   * الحصول على إحصائيات جميع المعارض
   * @param activeOnly استرجاع المعارض النشطة فقط
   * @returns إحصائيات المعارض
   */
  getVenueStats(activeOnly: boolean = false): VenueActivityStats[] {
    const stats: VenueActivityStats[] = [];
    
    this.venues.forEach(venue => {
      if (!activeOnly || venue.isActive) {
        stats.push(venue);
      }
    });
    
    // ترتيب المعارض حسب درجة النشاط (من الأعلى إلى الأقل)
    return stats.sort((a, b) => b.activityScore - a.activityScore);
  }
  
  /**
   * الحصول على إحصائيات معرض معين
   * @param venueId معرّف المعرض
   * @returns إحصائيات المعرض
   */
  getVenueStatsById(venueId: string): VenueActivityStats | null {
    return this.venues.get(venueId) || null;
  }
} 
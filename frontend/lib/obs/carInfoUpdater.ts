// مكتبة تحديث معلومات السيارة على شاشة البث المباشر
// تقوم بتحديث النص في OBS وإدارة الوقت المتبقي للمزاد

import { CarInfo } from './obsService';

// واجهة إعدادات مصدر النص في OBS
export interface TextSourceSettings {
  sourceName: string;
  fontSize: number;
  fontFamily: string;
  alignment: 'left' | 'center' | 'right';
  color: string;
  backgroundColor?: string;
  outline?: boolean;
  outlineColor?: string;
  outlineSize?: number;
}

// إعدادات افتراضية
const DEFAULT_SETTINGS: TextSourceSettings = {
  sourceName: 'معلومات_السيارة',
  fontSize: 28,
  fontFamily: 'Cairo',
  alignment: 'right',
  color: '#ffffff',
  outline: true,
  outlineColor: '#000000',
  outlineSize: 2
};

// واجهة معلومات المزاد
export interface AuctionInfo {
  carInfo: CarInfo;
  timeRemaining: number; // بالثواني
  endTime: Date;
  highestBidder?: {
    name: string;
    amount: number;
    bidTime: Date;
  };
  minBidIncrement: number;
  isActive: boolean;
}

/**
 * محول معلومات السيارة إلى نص لعرضه في OBS
 */
export class CarInfoUpdater {
  private settings: TextSourceSettings;
  private currentAuction: AuctionInfo | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private updateCallback: (text: string, sourceName: string) => Promise<boolean>;
  
  /**
   * إنشاء محدث معلومات السيارة
   * @param updateCallback دالة لتحديث النص في OBS
   * @param settings إعدادات مصدر النص (اختياري)
   */
  constructor(
    updateCallback: (text: string, sourceName: string) => Promise<boolean>,
    settings?: Partial<TextSourceSettings>
  ) {
    this.settings = { ...DEFAULT_SETTINGS, ...settings };
    this.updateCallback = updateCallback;
  }
  
  /**
   * بدء تحديث معلومات المزاد
   * @param auctionInfo معلومات المزاد
   * @param updateIntervalMs فترة التحديث بالمللي ثانية (افتراضي: 1000)
   */
  startAuctionUpdate(auctionInfo: AuctionInfo, updateIntervalMs: number = 1000): void {
    // إيقاف أي تحديث سابق
    this.stopAuctionUpdate();
    
    // تعيين معلومات المزاد الحالي
    this.currentAuction = auctionInfo;
    
    // إرسال التحديث الأول فوراً
    this.updateAuctionDisplay();
    
    // بدء تحديث دوري
    this.updateInterval = setInterval(() => {
      this.updateAuctionDisplay();
    }, updateIntervalMs);
  }
  
  /**
   * إيقاف تحديث معلومات المزاد
   */
  stopAuctionUpdate(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
  
  /**
   * تحديث عرض معلومات المزاد
   * يحسب الوقت المتبقي ويرسل النص المحدث إلى OBS
   */
  private updateAuctionDisplay(): void {
    if (!this.currentAuction) return;
    
    // حساب الوقت المتبقي
    let timeRemaining = 0;
    
    if (this.currentAuction.isActive) {
      const now = new Date();
      const remainingMs = this.currentAuction.endTime.getTime() - now.getTime();
      timeRemaining = Math.max(0, Math.floor(remainingMs / 1000));
      
      // تحديث الوقت المتبقي في كائن المزاد
      this.currentAuction.timeRemaining = timeRemaining;
    }
    
    // إنشاء نص العرض
    const displayText = this.formatAuctionInfo(this.currentAuction);
    
    // إرسال التحديث إلى OBS
    this.updateCallback(displayText, this.settings.sourceName)
      .catch(err => console.error('خطأ في تحديث معلومات السيارة:', err));
  }
  
  /**
   * تنسيق معلومات المزاد كنص للعرض
   * @param auction معلومات المزاد
   * @returns النص المنسق للعرض
   */
  private formatAuctionInfo(auction: AuctionInfo): string {
    const { carInfo, timeRemaining, highestBidder, minBidIncrement } = auction;
    
    // تنسيق الوقت المتبقي (دقائق:ثواني)
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // إنشاء النص المنسق
    return `
معلومات السيارة:
${carInfo.make} ${carInfo.model} ${carInfo.year}
اللون: ${carInfo.color}

السعر الحالي: ${carInfo.currentPrice.toLocaleString()} ريال
${highestBidder ? `صاحب أعلى عرض: ${highestBidder.name}` : ''}
الحد الأدنى للمزايدة: ${minBidIncrement.toLocaleString()} ريال

⏱ الوقت المتبقي: ${timeStr}
`.trim();
  }
  
  /**
   * تحديث معلومات السيارة فقط
   * @param carInfo معلومات السيارة الجديدة
   */
  updateCarInfo(carInfo: CarInfo): void {
    if (!this.currentAuction) return;
    
    this.currentAuction.carInfo = carInfo;
    this.updateAuctionDisplay();
  }
  
  /**
   * تحديث معلومات المزايد الأعلى
   * @param bidderName اسم المزايد
   * @param amount مبلغ المزايدة
   */
  updateHighestBidder(bidderName: string, amount: number): void {
    if (!this.currentAuction) return;
    
    this.currentAuction.highestBidder = {
      name: bidderName,
      amount: amount,
      bidTime: new Date()
    };
    
    // تحديث السعر الحالي للسيارة
    this.currentAuction.carInfo.currentPrice = amount;
    
    this.updateAuctionDisplay();
  }
  
  /**
   * تمديد وقت المزاد
   * @param additionalSeconds عدد الثواني الإضافية
   */
  extendAuctionTime(additionalSeconds: number): void {
    if (!this.currentAuction) return;
    
    const newEndTime = new Date(this.currentAuction.endTime.getTime() + (additionalSeconds * 1000));
    this.currentAuction.endTime = newEndTime;
    
    this.updateAuctionDisplay();
  }
  
  /**
   * إيقاف/تشغيل المزاد
   * @param isActive حالة نشاط المزاد
   */
  setAuctionActive(isActive: boolean): void {
    if (!this.currentAuction) return;
    
    this.currentAuction.isActive = isActive;
    
    // إذا تم تنشيط المزاد مرة أخرى، قم بتحديث وقت الانتهاء
    if (isActive) {
      const now = new Date();
      this.currentAuction.endTime = new Date(now.getTime() + (this.currentAuction.timeRemaining * 1000));
    }
    
    this.updateAuctionDisplay();
  }
} 
// خدمة إدارة OBS Studio في منصة DASM
// توفر واجهة سهلة الاستخدام للتفاعل مع OBS عبر WebSocket

import { OBSWebSocket, getOBSInstance } from './obsWebSocket';
import { CarInfoUpdater, TextSourceSettings, AuctionInfo } from './carInfoUpdater';

// أنواع المشاهد الشائعة
export enum SceneType {
  INTRO = 'المقدمة',
  MAIN_AUCTION = 'المزاد الرئيسي',
  CAR_DETAILS = 'تفاصيل السيارة',
  PRICING = 'عرض السعر',
  OUTRO = 'الختام'
}

// معلومات السيارة
export interface CarInfo {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  currentPrice: number;
  highestBidder?: string;
  timeRemaining?: number;
}

// معلومات المعرض
export interface VenueInfo {
  id: string;
  name: string;
  streamKey: string;
  rtmpUrl: string;
  isLive: boolean;
  schedule?: {
    startTime: Date;
    endTime: Date;
  };
}

/**
 * خدمة إدارة OBS للتحكم في البث المباشر
 */
export class OBSService {
  private obs: OBSWebSocket;
  private currentVenue: VenueInfo | null = null;
  private sceneNames: string[] = [];
  private connected: boolean = false;
  private streamingActive: boolean = false;
  private carInfoUpdater: CarInfoUpdater | null = null;
  private currentAuction: AuctionInfo | null = null;

  /**
   * إنشاء خدمة OBS جديدة
   * @param ip عنوان IP للخادم
   * @param port رقم المنفذ
   * @param password كلمة المرور
   */
  constructor(
    ip: string = 'localhost',
    port: number = 4455,
    password: string = ''
  ) {
    this.obs = getOBSInstance(ip, port, password);
    
    // الاستماع لأحداث OBS
    this.obs.on('connected', this.handleConnection.bind(this));
    this.obs.on('disconnected', this.handleDisconnection.bind(this));
    this.obs.on('StreamStarted', this.handleStreamStarted.bind(this));
    this.obs.on('StreamStopped', this.handleStreamStopped.bind(this));
    
    // إنشاء محدث معلومات السيارة
    this.carInfoUpdater = new CarInfoUpdater(this.updateTextSource.bind(this));
  }

  /**
   * الاتصال بـ OBS Studio
   */
  async connect(): Promise<boolean> {
    try {
      const result = await this.obs.connect();
      if (result) {
        console.log('تم الاتصال بـ OBS Studio بنجاح');
        await this.refreshSceneList();
      }
      return result;
    } catch (error) {
      console.error('فشل الاتصال بـ OBS Studio:', error);
      return false;
    }
  }

  /**
   * معالجة حدث الاتصال
   */
  private async handleConnection(): Promise<void> {
    this.connected = true;
    await this.refreshSceneList();
    
    // التحقق من حالة البث الحالية
    try {
      const status = await this.obs.getStreamingStatus();
      this.streamingActive = status.streaming;
    } catch (error) {
      console.error('خطأ في الحصول على حالة البث:', error);
    }
  }

  /**
   * معالجة حدث قطع الاتصال
   */
  private handleDisconnection(): void {
    this.connected = false;
    this.streamingActive = false;
  }

  /**
   * معالجة حدث بدء البث
   */
  private handleStreamStarted(): void {
    this.streamingActive = true;
    console.log('تم بدء البث بنجاح');
  }

  /**
   * معالجة حدث إيقاف البث
   */
  private handleStreamStopped(): void {
    this.streamingActive = false;
    console.log('تم إيقاف البث');
  }

  /**
   * تحديث قائمة المشاهد من OBS
   */
  private async refreshSceneList(): Promise<string[]> {
    if (!this.connected) {
      console.warn('غير متصل بـ OBS، لا يمكن تحديث قائمة المشاهد');
      return [];
    }
    
    try {
      const response = await this.obs.getScenes();
      this.sceneNames = response.scenes.map((scene: any) => scene.name);
      return this.sceneNames;
    } catch (error) {
      console.error('خطأ في الحصول على قائمة المشاهد:', error);
      return [];
    }
  }

  /**
   * الحصول على قائمة المشاهد
   */
  getScenes(): string[] {
    return this.sceneNames;
  }

  /**
   * تغيير المشهد الحالي
   * @param sceneName اسم المشهد
   */
  async switchScene(sceneName: string): Promise<boolean> {
    if (!this.connected) {
      console.warn('غير متصل بـ OBS، لا يمكن تغيير المشهد');
      return false;
    }
    
    try {
      await this.obs.setCurrentScene(sceneName);
      console.log(`تم التبديل إلى المشهد: ${sceneName}`);
      return true;
    } catch (error) {
      console.error(`خطأ في التبديل إلى المشهد ${sceneName}:`, error);
      return false;
    }
  }

  /**
   * تعيين المعرض الحالي وتحديث إعدادات البث
   * @param venue معلومات المعرض
   */
  async setCurrentVenue(venue: VenueInfo): Promise<boolean> {
    this.currentVenue = venue;
    
    // هنا يمكن إضافة منطق لتحديث إعدادات البث في OBS
    // مثل تحديث عنوان RTMP ومفتاح البث
    
    console.log(`تم تعيين المعرض الحالي: ${venue.name}`);
    return true;
  }

  /**
   * بدء البث المباشر
   */
  async startStreaming(): Promise<boolean> {
    if (!this.connected) {
      console.warn('غير متصل بـ OBS، لا يمكن بدء البث');
      return false;
    }
    
    if (!this.currentVenue) {
      console.warn('لم يتم تعيين معرض حالي، لا يمكن بدء البث');
      return false;
    }
    
    try {
      await this.obs.startStreaming();
      this.streamingActive = true;
      console.log(`تم بدء البث لمعرض: ${this.currentVenue.name}`);
      return true;
    } catch (error) {
      console.error('خطأ في بدء البث:', error);
      return false;
    }
  }

  /**
   * إيقاف البث المباشر
   */
  async stopStreaming(): Promise<boolean> {
    if (!this.connected) {
      console.warn('غير متصل بـ OBS، لا يمكن إيقاف البث');
      return false;
    }
    
    try {
      await this.obs.stopStreaming();
      this.streamingActive = false;
      console.log('تم إيقاف البث');
      return true;
    } catch (error) {
      console.error('خطأ في إيقاف البث:', error);
      return false;
    }
  }

  /**
   * التحقق من حالة البث
   */
  isStreaming(): boolean {
    return this.streamingActive;
  }

  /**
   * التحقق من حالة الاتصال
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * تحديث معلومات السيارة المعروضة
   * @param carInfo معلومات السيارة
   * @param textSourceName اسم مصدر النص في OBS
   */
  async updateCarInfo(carInfo: CarInfo, textSourceName: string = 'معلومات_السيارة'): Promise<boolean> {
    if (!this.connected) {
      console.warn('غير متصل بـ OBS، لا يمكن تحديث معلومات السيارة');
      return false;
    }
    
    try {
      if (this.carInfoUpdater && this.currentAuction) {
        // إذا كان هناك مزاد نشط، قم بتحديث معلومات السيارة فقط
        this.carInfoUpdater.updateCarInfo(carInfo);
        return true;
      } else {
        // إذا لم يكن هناك مزاد نشط، قم بتحديث النص مباشرة
        const formattedText = `
          الماركة: ${carInfo.make}
          الموديل: ${carInfo.model}
          السنة: ${carInfo.year}
          اللون: ${carInfo.color}
          السعر الحالي: ${carInfo.currentPrice.toLocaleString()} ريال
          ${carInfo.highestBidder ? `صاحب أعلى مزايدة: ${carInfo.highestBidder}` : ''}
          ${carInfo.timeRemaining ? `الوقت المتبقي: ${carInfo.timeRemaining} ثانية` : ''}
        `;
        
        return this.updateTextSource(formattedText, textSourceName);
      }
    } catch (error) {
      console.error('خطأ في تحديث معلومات السيارة:', error);
      return false;
    }
  }

  /**
   * تحديث مصدر النص في OBS
   * @param text النص الجديد
   * @param sourceName اسم المصدر
   */
  async updateTextSource(text: string, sourceName: string): Promise<boolean> {
    if (!this.connected) {
      console.warn('غير متصل بـ OBS، لا يمكن تحديث مصدر النص');
      return false;
    }

    try {
      await this.obs.setSourceText(sourceName, text);
      console.log(`تم تحديث النص في مصدر ${sourceName}`);
      return true;
    } catch (error) {
      console.error(`خطأ في تحديث النص في مصدر ${sourceName}:`, error);
      return false;
    }
  }

  /**
   * بدء مزاد جديد وعرض معلوماته
   * @param auctionInfo معلومات المزاد
   */
  startAuction(auctionInfo: AuctionInfo): boolean {
    if (!this.connected || !this.carInfoUpdater) {
      console.warn('غير متصل بـ OBS، لا يمكن بدء المزاد');
      return false;
    }

    this.currentAuction = auctionInfo;
    this.carInfoUpdater.startAuctionUpdate(auctionInfo);
    console.log('تم بدء المزاد وتحديث معلوماته');
    return true;
  }

  /**
   * إنهاء المزاد الحالي
   */
  stopAuction(): boolean {
    if (!this.carInfoUpdater) {
      return false;
    }

    this.carInfoUpdater.stopAuctionUpdate();
    this.currentAuction = null;
    console.log('تم إيقاف المزاد');
    return true;
  }

  /**
   * تحديث معلومات المزايد الأعلى
   * @param bidderName اسم المزايد
   * @param amount مبلغ المزايدة
   */
  updateHighestBidder(bidderName: string, amount: number): boolean {
    if (!this.carInfoUpdater || !this.currentAuction) {
      console.warn('لا يوجد مزاد نشط حالياً');
      return false;
    }

    this.carInfoUpdater.updateHighestBidder(bidderName, amount);
    console.log(`تم تحديث أعلى مزايدة: ${bidderName}, ${amount}`);
    return true;
  }

  /**
   * تمديد وقت المزاد
   * @param additionalSeconds عدد الثواني الإضافية
   */
  extendAuctionTime(additionalSeconds: number): boolean {
    if (!this.carInfoUpdater || !this.currentAuction) {
      console.warn('لا يوجد مزاد نشط حالياً');
      return false;
    }

    this.carInfoUpdater.extendAuctionTime(additionalSeconds);
    console.log(`تم تمديد وقت المزاد بـ ${additionalSeconds} ثانية`);
    return true;
  }

  /**
   * تكوين مصدر النص في OBS
   * @param settings إعدادات مصدر النص
   */
  async configureTextSource(settings: TextSourceSettings): Promise<boolean> {
    if (!this.connected) {
      console.warn('غير متصل بـ OBS، لا يمكن تكوين مصدر النص');
      return false;
    }

    try {
      // قم بتحديث خصائص مصدر النص في OBS
      await this.obs.send('SetTextGDIPlusProperties', {
        'source': settings.sourceName,
        'font': {
          'face': settings.fontFamily,
          'size': settings.fontSize
        },
        'color': settings.color,
        'bgcolor': settings.backgroundColor || 0,
        'outline': settings.outline || false,
        'outline_color': settings.outlineColor || 0,
        'outline_size': settings.outlineSize || 0,
        'alignment': settings.alignment === 'center' ? 1 : (settings.alignment === 'right' ? 2 : 0)
      });

      console.log(`تم تكوين مصدر النص ${settings.sourceName}`);
      return true;
    } catch (error) {
      console.error(`خطأ في تكوين مصدر النص ${settings.sourceName}:`, error);
      return false;
    }
  }

  /**
   * إنشاء مصدر نص جديد في OBS
   * @param sceneName اسم المشهد
   * @param settings إعدادات مصدر النص
   */
  async createTextSource(sceneName: string, settings: TextSourceSettings): Promise<boolean> {
    if (!this.connected) {
      console.warn('غير متصل بـ OBS، لا يمكن إنشاء مصدر النص');
      return false;
    }

    try {
      // إنشاء مصدر نص جديد في المشهد المحدد
      await this.obs.send('CreateSource', {
        'sourceName': settings.sourceName,
        'sourceKind': 'text_gdiplus',
        'sceneName': sceneName,
        'sourceSettings': {
          'font': {
            'face': settings.fontFamily,
            'size': settings.fontSize
          },
          'color': settings.color,
          'bgcolor': settings.backgroundColor || 0,
          'outline': settings.outline || false,
          'outline_color': settings.outlineColor || 0,
          'outline_size': settings.outlineSize || 0,
          'alignment': settings.alignment === 'center' ? 1 : (settings.alignment === 'right' ? 2 : 0),
          'text': 'معلومات المزاد ستظهر هنا'
        }
      });

      console.log(`تم إنشاء مصدر النص ${settings.sourceName} في المشهد ${sceneName}`);
      return true;
    } catch (error) {
      console.error(`خطأ في إنشاء مصدر النص ${settings.sourceName}:`, error);
      return false;
    }
  }
}

// كائن singleton للاستخدام في جميع أنحاء التطبيق
let obsServiceInstance: OBSService | null = null;

/**
 * الحصول على مثيل خدمة OBS
 */
export function getOBSService(
  ip: string = 'localhost',
  port: number = 4455,
  password: string = ''
): OBSService {
  if (!obsServiceInstance) {
    obsServiceInstance = new OBSService(ip, port, password);
  }
  return obsServiceInstance;
} 
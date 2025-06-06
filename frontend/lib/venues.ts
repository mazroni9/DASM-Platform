/**
 * ==================================================
 * ملف: frontend/lib/api/venues.ts
 * الغرض: واجهة برمجة التطبيقات للتعامل مع بيانات المعارض
 * الارتباطات: 
 *  - يستخدم API من الخادم لجلب بيانات المعارض
 *  - يوفر وظائف لجلب بيانات المعارض وتفاصيلها
 * ==================================================
 */

// واجهة بيانات المعرض
export interface Venue {
  id: string;
  name: string;
  location: string;
  region: string;
  city: string;
  youtubeChannel: string;
  youtubeVideoId: string;
  isLive: boolean;
  startTime: string;
  auctionType: 'live' | 'silent' | 'instant';
  currentViewers: number;
  detailsUrl: string;
  logoUrl?: string;
}

// واجهة خيارات التصفية
export interface VenueFilterOptions {
  region?: string;
  city?: string;
  auctionType?: string;
  onlyLive?: boolean;
  search?: string;
}

/**
 * جلب جميع المعارض النشطة مع دعم للتصفية
 * يستخدم API لجلب البيانات من الخادم
 */
export async function getVenues(filters?: VenueFilterOptions): Promise<Venue[]> {
  try {
    // بناء URL مع معلمات الاستعلام
    const url = new URL('/api/venues', window.location.origin);
    
    // إضافة معلمات التصفية إلى URL
    if (filters) {
      if (filters.region && filters.region !== 'all') {
        url.searchParams.append('region', filters.region);
      }
      
      if (filters.city && filters.city !== 'all') {
        url.searchParams.append('city', filters.city);
      }
      
      if (filters.auctionType && filters.auctionType !== 'all') {
        url.searchParams.append('auctionType', filters.auctionType);
      }
      
      if (filters.onlyLive) {
        url.searchParams.append('onlyLive', 'true');
      }
      
      if (filters.search) {
        url.searchParams.append('search', filters.search);
      }
    }
    
    // جلب البيانات باستخدام fetch
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`فشل الاستعلام: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;

  } catch (error) {
    console.error('خطأ في جلب بيانات المعارض:', error);
    
    // استخدام بيانات تجريبية في حالة الخطأ
    const mockData: Venue[] = [
      {
        id: 'maz1',
        name: 'معرض MAZ للسيارات - الدمام',
        location: 'الدمام، حي الشاطئ، طريق الخليج، بجوار كوبري الملك فهد',
        region: 'eastern',
        city: 'dammam',
        youtubeChannel: 'UCxiLyu5z-T0FanDNotwTJcg',
        youtubeVideoId: 'jfKfPfyJRdk',
        isLive: true,
        startTime: new Date().toISOString(),
        auctionType: 'live',
        currentViewers: 1253,
        detailsUrl: '/auctions/auctions-1main/live-market',
        logoUrl: '/logo.jpg'
      },
      {
        id: 'maz2',
        name: 'معرض MAZ للسيارات - الخبر',
        location: 'الخبر، حي الراكة، شارع الملك فيصل، مقابل مجمع الراشد التجاري',
        region: 'eastern',
        city: 'khobar',
        youtubeChannel: 'UCxiLyu5z-T0FanDNotwTJcg',
        youtubeVideoId: '5qap5aO4i9A',
        isLive: true,
        startTime: new Date().toISOString(),
        auctionType: 'live',
        currentViewers: 892,
        detailsUrl: '/auctions/auctions-1main/live-market',
        logoUrl: '/logo.jpg'
      },
      {
        id: 'maz3',
        name: 'قاعة مزادات MAZ - الجبيل',
        location: 'الجبيل، حي الفناتير، شارع المرجان، بالقرب من بوابة الجبيل الصناعية',
        region: 'eastern',
        city: 'jubail',
        youtubeChannel: 'UCxiLyu5z-T0FanDNotwTJcg',
        youtubeVideoId: '',
        isLive: false,
        startTime: new Date(Date.now() + 259200000).toISOString(),
        auctionType: 'silent',
        currentViewers: 0,
        detailsUrl: '/auctions/auctions-1main/silent',
        logoUrl: '/logo.jpg'
      },
    ];
    return mockData;
  }
}

/**
 * جلب معرض واحد بواسطة المعرف
 */
export async function getVenueById(id: string): Promise<Venue | null> {
  try {
    // استخدام getVenues وتصفية النتائج للحصول على المعرض المطلوب
    const venues = await getVenues();
    return venues.find(venue => venue.id === id) || null;
  } catch (error) {
    console.error('خطأ في جلب بيانات المعرض:', error);
    return null;
  }
}

/**
 * تحديث عدد المشاهدين للبث المباشر
 * يستخدم API من الخادم لتحديث البيانات
 */
export async function updateViewersCount(id: string, count: number): Promise<boolean> {
  try {
    const response = await fetch('/api/venues', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id,
        viewersCount: count,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`فشل التحديث: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('خطأ في تحديث عدد المشاهدين:', error);
    return false;
  }
} 
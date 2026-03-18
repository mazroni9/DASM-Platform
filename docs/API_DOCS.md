# توثيق واجهات برمجة التطبيقات (API) لواجهة البث متعددة القنوات

## نظرة عامة

يصف هذا المستند واجهات البرمجة (APIs) المطلوبة للتكامل مع واجهة البث متعددة القنوات في منصة DASM. يشمل التوثيق نقاط النهاية الأساسية، بنية البيانات، ونماذج الاستخدام.

## 1. واجهة برمجة المعارض

### 1.1 الحصول على قائمة المعارض

**طلب HTTP:**
```
GET /api/venues
```

**معلمات الاستعلام:**
- `region` (اختياري): تصفية حسب المنطقة (central, eastern, western, northern, southern)
- `auctionType` (اختياري): تصفية حسب نوع المزاد (live, silent, instant)
- `isLive` (اختياري): تصفية المعارض المباشرة فقط (true/false)
- `search` (اختياري): بحث في اسم المعرض والموقع

**نموذج الاستجابة:**
```json
{
  "venues": [
    {
      "id": "venue1",
      "name": "معرض الرياض للسيارات",
      "location": "الرياض، حي المعذر",
      "region": "central",
      "youtubeChannel": "UC1234567890",
      "youtubeVideoId": "jfKfPfyJRdk",
      "isLive": true,
      "startTime": "2023-10-20T18:00:00Z",
      "auctionType": "live",
      "currentViewers": 1253
    },
    // ...المزيد من المعارض
  ],
  "total": 5,
  "page": 1,
  "pageSize": 10
}
```

### 1.2 الحصول على معلومات معرض محدد

**طلب HTTP:**
```
GET /api/venues/:venueId
```

**نموذج الاستجابة:**
```json
{
  "id": "venue1",
  "name": "معرض الرياض للسيارات",
  "location": "الرياض، حي المعذر",
  "region": "central",
  "youtubeChannel": "UC1234567890",
  "youtubeVideoId": "jfKfPfyJRdk",
  "isLive": true,
  "startTime": "2023-10-20T18:00:00Z",
  "auctionType": "live",
  "currentViewers": 1253,
  "description": "معرض رائد في مجال بيع وشراء السيارات الفاخرة...",
  "contactInfo": {
    "phone": "+966123456789",
    "email": "info@riyadh-auto.com",
    "website": "https://riyadh-auto.com"
  },
  "address": {
    "city": "الرياض",
    "district": "حي المعذر",
    "street": "طريق الملك فهد",
    "coordinates": {
      "lat": 24.7136,
      "lng": 46.6753
    }
  },
  "schedule": {
    "regularHours": {
      "sunday": "9:00 - 21:00",
      "monday": "9:00 - 21:00",
      // ...باقي أيام الأسبوع
    },
    "upcomingAuctions": [
      {
        "id": "auction1",
        "title": "مزاد الخميس الأسبوعي",
        "date": "2023-10-27T18:00:00Z"
      }
      // ...المزيد من المزادات القادمة
    ]
  }
}
```

## 2. واجهة برمجة المزادات

### 2.1 الحصول على معلومات المزاد الحالي في معرض محدد

**طلب HTTP:**
```
GET /api/venues/:venueId/current-auction
```

**نموذج الاستجابة:**
```json
{
  "id": "auction123",
  "status": "active",
  "startTime": "2023-10-20T18:00:00Z",
  "endTime": "2023-10-20T22:00:00Z",
  "currentItem": {
    "id": 12345,
    "title": "تويوتا لاندكروزر GXR 2022",
    "make": "تويوتا",
    "model": "لاندكروزر GXR",
    "year": 2022,
    "mileage": 25000,
    "color": "أبيض لؤلؤي",
    "images": ["/images/cars/landcruiser1.jpg", "/images/cars/landcruiser2.jpg"],
    "minPrice": 320000,
    "currentPrice": 358000,
    "nextIncrement": 2000,
    "endTime": "2023-10-20T19:45:00Z"
  },
  "activeParticipants": 42,
  "totalItems": 20,
  "completedItems": 5
}
```

### 2.2 الحصول على المزايدات الحالية للسيارة

**طلب HTTP:**
```
GET /api/auctions/:auctionId/items/:itemId/bids
```

**معلمات الاستعلام:**
- `limit` (اختياري): عدد المزايدات المطلوب إرجاعها (الافتراضي: 10)

**نموذج الاستجابة:**
```json
{
  "bids": [
    {
      "id": "bid1",
      "bidderName": "محمد أحمد",
      "amount": 358000,
      "timestamp": "2023-10-20T19:28:30Z",
      "isOnline": true
    },
    {
      "id": "bid2",
      "bidderName": "فهد العبدالله",
      "amount": 356000,
      "timestamp": "2023-10-20T19:27:45Z",
      "isOnline": false
    }
    // ...المزيد من المزايدات
  ],
  "total": 25
}
```

### 2.3 تقديم مزايدة جديدة

**طلب HTTP:**
```
POST /api/auctions/:auctionId/items/:itemId/bid
```

**رأس الطلب:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**نموذج الطلب:**
```json
{
  "amount": 360000
}
```

**نموذج الاستجابة:**
```json
{
  "success": true,
  "bid": {
    "id": "bid26",
    "bidderName": "أنت",
    "amount": 360000,
    "timestamp": "2023-10-20T19:30:15Z",
    "isOnline": true
  },
  "newCurrentPrice": 360000,
  "nextIncrement": 2000
}
```

## 3. واجهة برمجة WebSocket

لتوفير تحديثات في الوقت الحقيقي، يجب استخدام اتصال WebSocket:

**نقطة الاتصال:**
```
wss://api.dasm-platform.com/ws
```

**رسائل المصادقة:**
```json
{
  "type": "auth",
  "token": "{token}"
}
```

**أنواع الأحداث المستلمة:**

1. **تحديث حالة المزاد:**
```json
{
  "type": "auction_status",
  "venueId": "venue1",
  "auctionId": "auction123",
  "status": "active"
}
```

2. **مزايدة جديدة:**
```json
{
  "type": "new_bid",
  "venueId": "venue1",
  "auctionId": "auction123",
  "itemId": 12345,
  "bid": {
    "id": "bid27",
    "bidderName": "سعد محمد",
    "amount": 362000,
    "timestamp": "2023-10-20T19:31:20Z",
    "isOnline": true
  },
  "newCurrentPrice": 362000
}
```

3. **تغيير السيارة:**
```json
{
  "type": "item_change",
  "venueId": "venue1",
  "auctionId": "auction123",
  "item": {
    "id": 12346,
    "title": "مرسيدس S500 2021",
    "make": "مرسيدس",
    "model": "S500",
    "year": 2021,
    // ...باقي بيانات السيارة
  }
}
```

4. **تحديث عدد المشاهدين:**
```json
{
  "type": "viewers_update",
  "venueId": "venue1",
  "viewers": 1280
}
```

## 4. معلمات تكوين YouTube API

لتضمين بث يوتيوب، يمكن استخدام المعلمات التالية:

```javascript
const params = new URLSearchParams({
  autoplay: '1',         // تشغيل تلقائي
  mute: '1',             // كتم الصوت افتراضيًا
  modestbranding: '1',   // إخفاء شعار يوتيوب
  rel: '0',              // عدم عرض مقاطع ذات صلة
  showinfo: '0',         // إخفاء معلومات الفيديو
  controls: '1',         // إظهار أزرار التحكم
  enablejsapi: '1',      // تمكين واجهة برمجة JavaScript
  hl: 'ar',              // تعيين اللغة للعربية
  origin: window.location.origin // تحديد أصل الصفحة للأمان
});

const embedUrl = `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
```

## ملاحظات أمنية

1. يجب استخدام تشفير HTTPS لجميع الطلبات
2. يجب التحقق من صلاحية المصادقة لأي عمليات تتطلب امتيازات المستخدم
3. يجب تعيين `origin` بشكل صحيح في طلبات تضمين YouTube لمنع هجمات التزييف
4. يجب استخدام نظام CORS المقيد للسماح فقط بالطلبات من النطاقات المصرح بها

## أمثلة التكامل

### مثال: الاتصال بـ WebSocket والاستماع إلى الأحداث

```javascript
const socket = new WebSocket('wss://api.dasm-platform.com/ws');

socket.onopen = () => {
  console.log('تم الاتصال بالخادم');
  
  // إرسال معلومات المصادقة
  const authToken = localStorage.getItem('auth_token');
  if (authToken) {
    socket.send(JSON.stringify({
      type: 'auth',
      token: authToken
    }));
  }
};

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'new_bid':
      console.log('مزايدة جديدة:', data.bid);
      // تحديث واجهة المستخدم بالمزايدة الجديدة
      break;
    case 'auction_status':
      console.log('تغيير حالة المزاد:', data.status);
      // تحديث حالة المزاد في الواجهة
      break;
    case 'item_change':
      console.log('تغيير السيارة الحالية:', data.item);
      // تحديث معلومات السيارة في الواجهة
      break;
    default:
      console.log('رسالة غير معروفة:', data);
  }
};

socket.onclose = () => {
  console.log('تم قطع الاتصال');
};

socket.onerror = (error) => {
  console.error('خطأ في الاتصال:', error);
};
```

### مثال: تقديم مزايدة جديدة

```javascript
async function placeBid(auctionId, itemId, amount) {
  try {
    const response = await fetch(`/api/auctions/${auctionId}/items/${itemId}/bid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({ amount })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('تم تقديم المزايدة بنجاح:', data.bid);
      return data;
    } else {
      console.error('فشل في تقديم المزايدة:', data.error);
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('خطأ في تقديم المزايدة:', error);
    throw error;
  }
} 
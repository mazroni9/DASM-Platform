# توثيق واجهة برمجة التطبيقات (API) لغرفة الكونترول

## نظرة عامة

يحدد هذا المستند واجهات البرمجة (APIs) المطلوبة للتكامل مع غرفة الكونترول في منصة DASM. يشمل التوثيق نقاط النهاية الأساسية، بنية البيانات، ونماذج الاستخدام للواجهة البرمجية للمُحرّج (المنادي).

## 1. واجهة برمجة المزادات

### 1.1 الحصول على بيانات المزاد الحالي

**طلب HTTP:**
```
GET /api/auctions/current
```

**رأس الطلب:**
```
Authorization: Bearer {token}
```

**نموذج الاستجابة:**
```json
{
  "id": "auction123",
  "status": "active",
  "venue_id": "venue1",
  "venue_name": "معرض الرياض للسيارات",
  "start_time": "2023-10-20T18:00:00Z",
  "current_car": {
    "id": 12345,
    "title": "تويوتا لاندكروزر GXR 2022",
    "make": "تويوتا",
    "model": "لاندكروزر GXR",
    "year": 2022,
    "mileage": 35000,
    "color": "أبيض لؤلؤي",
    "vin": "ABC123XYZ456789",
    "condition": "ممتاز",
    "images": ["/images/cars/landcruiser1.jpg", "/images/cars/landcruiser2.jpg"],
    "min_price": 320000,
    "max_price": 450000,
    "current_price": 358000,
    "description": "تويوتا لاندكروزر 2022 قير أوتوماتيك، فل كامل، ماشي 35 ألف كم، ضمان وصيانة مجانية لدى الوكيل",
    "seller_id": 45,
    "seller_name": "معرض الأمانة للسيارات"
  },
  "upcoming_cars": [
    {
      "id": 12346,
      "title": "مرسيدس S500 2021",
      "make": "مرسيدس",
      "model": "S500",
      "year": 2021,
      "mileage": 28000,
      "color": "أسود",
      "min_price": 420000,
      "max_price": 550000,
      "images": ["/images/cars/mercedes1.jpg"]
    },
    // ... المزيد من السيارات القادمة
  ],
  "stats": {
    "viewer_count": 213,
    "bidder_count": 42,
    "total_bids": 28
  }
}
```

### 1.2 بدء المزاد على السيارة التالية

**طلب HTTP:**
```
POST /api/auctions/next-car
```

**رأس الطلب:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**نموذج الاستجابة:**
```json
{
  "success": true,
  "auction_id": "auction123",
  "car": {
    "id": 12346,
    "title": "مرسيدس S500 2021",
    "make": "مرسيدس",
    "model": "S500",
    "year": 2021,
    // ... باقي بيانات السيارة
  }
}
```

### 1.3 إيقاف/استئناف المزاد مؤقتاً

**طلب HTTP:**
```
POST /api/auctions/toggle-pause
```

**رأس الطلب:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**نموذج الطلب:**
```json
{
  "status": "paused"  // أو "active" للاستئناف
}
```

**نموذج الاستجابة:**
```json
{
  "success": true,
  "status": "paused",  // أو "active" للاستئناف
  "message": "تم إيقاف المزاد مؤقتاً"  // أو "تم استئناف المزاد" للاستئناف
}
```

### 1.4 إنهاء المزاد الحالي

**طلب HTTP:**
```
POST /api/auctions/end-auction
```

**رأس الطلب:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**نموذج الطلب:**
```json
{
  "car_id": 12345,
  "sold": true  // أو false إذا لم يتم البيع
}
```

**نموذج الاستجابة:**
```json
{
  "success": true,
  "car_id": 12345,
  "status": "sold",  // أو "unsold" إذا لم يتم البيع
  "message": "تم إنهاء المزاد وبيع السيارة بنجاح"  // أو "تم إنهاء المزاد بدون بيع" إذا لم يتم البيع
}
```

## 2. واجهة برمجة المزايدات

### 2.1 الحصول على المزايدات الحالية

**طلب HTTP:**
```
GET /api/auctions/{auction_id}/cars/{car_id}/bids
```

**رأس الطلب:**
```
Authorization: Bearer {token}
```

**معلمات الاستعلام:**
- `limit` (اختياري): عدد المزايدات المطلوب إرجاعها (الافتراضي: 20)

**نموذج الاستجابة:**
```json
{
  "bids": [
    {
      "id": "bid123",
      "auction_id": "auction123",
      "car_id": 12345,
      "bidder_id": 789,
      "bidder_name": "محمد أحمد",
      "amount": 358000,
      "timestamp": "2023-10-20T19:28:30Z",
      "is_online": true
    },
    {
      "id": "bid122",
      "auction_id": "auction123",
      "car_id": 12345,
      "bidder_id": 790,
      "bidder_name": "فهد العبدالله",
      "amount": 356000,
      "timestamp": "2023-10-20T19:27:45Z",
      "is_online": false
    }
    // ... المزيد من المزايدات
  ],
  "total": 28
}
```

### 2.2 قبول/رفض مزايدة

**طلب HTTP:**
```
POST /api/bids/{bid_id}/respond
```

**رأس الطلب:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**نموذج الطلب:**
```json
{
  "accepted": true,  // أو false للرفض
  "message": "تم قبول المزايدة"  // اختياري، رسالة مخصصة
}
```

**نموذج الاستجابة:**
```json
{
  "success": true,
  "bid_id": "bid123",
  "status": "accepted",  // أو "rejected" للرفض
  "message": "تم قبول المزايدة بنجاح"
}
```

## 3. واجهة برمجة تحويل الصوت إلى نص

### 3.1 إرسال نص لعرضه على الشاشة

**طلب HTTP:**
```
POST /api/auctions/{auction_id}/display-text
```

**رأس الطلب:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**نموذج الطلب:**
```json
{
  "text": "وصلنا إلى مبلغ ثلاثمائة وخمسون ألف ريال - هل من مزايد؟",
  "duration": 10  // مدة العرض بالثواني (اختياري، الافتراضي 5 ثواني)
}
```

**نموذج الاستجابة:**
```json
{
  "success": true,
  "text_id": "text123",
  "message": "تم عرض النص على الشاشة"
}
```

## 4. واجهة برمجة WebSocket

لتوفير تحديثات في الوقت الحقيقي، يتم استخدام اتصال WebSocket:

**نقطة الاتصال:**
```
wss://api.dasm-platform.com/auctioneer-ws
```

**رسائل المصادقة:**
```json
{
  "type": "auth",
  "token": "{token}"
}
```

**أنواع الأحداث المستلمة:**

1. **مزايدة جديدة:**
```json
{
  "type": "new_bid",
  "data": {
    "id": "bid123",
    "auction_id": "auction123",
    "car_id": 12345,
    "bidder_id": 789,
    "bidder_name": "محمد أحمد",
    "amount": 358000,
    "timestamp": "2023-10-20T19:28:30Z",
    "is_online": true
  }
}
```

2. **تحديث حالة المزاد:**
```json
{
  "type": "auction_status",
  "data": {
    "auction_id": "auction123",
    "status": "active"  // أو "paused" أو "waiting"
  }
}
```

3. **تحديث الإحصائيات:**
```json
{
  "type": "stats_update",
  "data": {
    "auction_id": "auction123",
    "viewer_count": 220,
    "bidder_count": 45,
    "total_bids": 30
  }
}
```

**أنواع الأحداث المرسلة:**

1. **طلب الانتقال للسيارة التالية:**
```json
{
  "type": "next_car"
}
```

2. **طلب إيقاف/استئناف المزاد:**
```json
{
  "type": "toggle_pause",
  "data": {
    "status": "paused"  // أو "active" للاستئناف
  }
}
```

3. **طلب إنهاء المزاد:**
```json
{
  "type": "end_auction",
  "data": {
    "car_id": 12345,
    "sold": true  // أو false إذا لم يتم البيع
  }
}
```

4. **عرض نص على الشاشة:**
```json
{
  "type": "display_text",
  "data": {
    "text": "وصلنا إلى مبلغ ثلاثمائة وخمسون ألف ريال - هل من مزايد؟",
    "duration": 10  // مدة العرض بالثواني
  }
}
```

## أمثلة التكامل

### مثال: الاتصال بـ WebSocket والاستماع إلى الأحداث

```javascript
const socket = new WebSocket('wss://api.dasm-platform.com/auctioneer-ws');

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
      console.log('مزايدة جديدة:', data.data);
      // تحديث واجهة المستخدم بالمزايدة الجديدة
      break;
    case 'auction_status':
      console.log('تغيير حالة المزاد:', data.data.status);
      // تحديث حالة المزاد في الواجهة
      break;
    case 'stats_update':
      console.log('تحديث الإحصائيات:', data.data);
      // تحديث الإحصائيات في الواجهة
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
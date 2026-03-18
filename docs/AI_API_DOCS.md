# توثيق واجهات برمجة تطبيقات الذكاء الاصطناعي (AI APIs)

هذا المستند يوضح واجهات برمجة التطبيقات المستخدمة في تكامل الذكاء الاصطناعي مع منصة DASM. يغطي هذا التوثيق نقاط النهاية الرئيسية، بنية الطلبات والاستجابات، وأمثلة الاستخدام.

## جدول المحتويات

1. [نظرة عامة](#نظرة-عامة)
2. [واجهة برمجة تطبيقات معالجة الصور](#واجهة-برمجة-تطبيقات-معالجة-الصور)
3. [واجهة برمجة تطبيقات تحليل السيارات](#واجهة-برمجة-تطبيقات-تحليل-السيارات)
4. [واجهة برمجة تطبيقات تحليل السوق](#واجهة-برمجة-تطبيقات-تحليل-السوق)
5. [أمان واجهة برمجة التطبيقات](#أمان-واجهة-برمجة-التطبيقات)

## نظرة عامة

المنصة تستخدم مزيجًا من واجهات برمجة التطبيقات الداخلية والخارجية للذكاء الاصطناعي. في بيئة التطوير، يتم استخدام بيانات وهمية للاختبار، بينما في بيئة الإنتاج، يتم استخدام خدمات الذكاء الاصطناعي الحقيقية.

### معلومات أساسية

- **URL الأساسي**: `/api/ai`
- **تنسيق البيانات**: JSON
- **المصادقة**: Bearer Token

## واجهة برمجة تطبيقات معالجة الصور

تُستخدم لمعالجة وتحليل صور السيارات.

### تحسين الصورة

يقوم بتحسين جودة صورة السيارة وإبراز التفاصيل.

**طلب HTTP:**
```
POST /api/ai/image/enhance
```

**رأس الطلب:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**نموذج الطلب:**
```json
{
  "imageUrl": "https://example.com/car-image.jpg"
}
```

**نموذج الاستجابة:**
```json
{
  "originalUrl": "https://example.com/car-image.jpg",
  "enhancedUrl": "https://example.com/enhanced-car-image.jpg",
  "processingTime": 1234
}
```

### تحليل الصورة

يقوم بتحليل صورة السيارة للكشف عن الحالة والمشاكل.

**طلب HTTP:**
```
POST /api/ai/image/analyze
```

**رأس الطلب:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**نموذج الطلب:**
```json
{
  "imageUrl": "https://example.com/car-image.jpg"
}
```

**نموذج الاستجابة:**
```json
{
  "carParts": {
    "body": {
      "condition": "good",
      "confidence": 0.85,
      "detectedIssues": [
        {
          "type": "scratch",
          "severity": 0.3,
          "location": { "x": 230, "y": 150, "width": 50, "height": 10 }
        }
      ]
    },
    "wheels": {
      "condition": "excellent",
      "confidence": 0.92,
      "detectedIssues": []
    }
  },
  "overallCondition": "good",
  "confidenceScore": 0.87
}
```

### إزالة الخلفية

يقوم بإزالة خلفية صورة السيارة لعرض السيارة بشكل أفضل.

**طلب HTTP:**
```
POST /api/ai/image/remove-background
```

**رأس الطلب:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**نموذج الطلب:**
```json
{
  "imageUrl": "https://example.com/car-image.jpg"
}
```

**نموذج الاستجابة:**
```json
{
  "originalUrl": "https://example.com/car-image.jpg",
  "processedImageUrl": "https://example.com/no-bg-car-image.png",
  "processingTime": 986
}
```

## واجهة برمجة تطبيقات تحليل السيارات

تُستخدم لتحليل وتقييم السيارات.

### تحليل صحة السيارة

يقوم بتحليل حالة السيارة وصحتها العامة.

**طلب HTTP:**
```
GET /api/ai/car/health/{carId}
```

**باراميترات URL:**
- `carId`: معرف السيارة

**باراميترات الاستعلام:**
- `includeImageAnalysis` (اختياري): هل يتم تضمين تحليل الصور (true/false، الافتراضي: true)

**رأس الطلب:**
```
Authorization: Bearer {token}
```

**نموذج الاستجابة:**
```json
{
  "carId": 123,
  "overallHealthScore": 85,
  "healthIndex": {
    "exterior": 90,
    "engine": 85,
    "interior": 88,
    "suspension": 80,
    "electronics": 83
  },
  "estimatedLifeExpectancy": {
    "years": 7,
    "kilometers": 120000
  },
  "detectedIssues": [
    {
      "component": "هيكل السيارة",
      "issue": "خدوش سطحية",
      "severity": "low",
      "estimatedRepairCost": 500
    },
    {
      "component": "نظام التعليق",
      "issue": "تآكل في المساعدات الخلفية",
      "severity": "medium",
      "estimatedRepairCost": 1200
    }
  ],
  "recommendedChecks": [
    "فحص حالة الإطارات",
    "فحص نظام التعليق الخلفي",
    "فحص وضع محاذاة العجلات"
  ],
  "confidenceScore": 0.87
}
```

### تقييم قيمة السيارة

يقوم بتحليل القيمة السوقية للسيارة.

**طلب HTTP:**
```
GET /api/ai/car/value/{carId}
```

**باراميترات URL:**
- `carId`: معرف السيارة

**رأس الطلب:**
```
Authorization: Bearer {token}
```

**نموذج الاستجابة:**
```json
{
  "carId": 123,
  "estimatedMarketValue": 85000,
  "priceRange": {
    "min": 80000,
    "max": 92000
  },
  "comparisonFactors": {
    "make": "تويوتا",
    "model": "كامري",
    "year": 2020,
    "condition": "جيدة",
    "mileage": 50000,
    "region": "الرياض"
  },
  "marketTrend": "stable",
  "similarCars": [
    {
      "id": 1001,
      "price": 83000,
      "soldDate": "2023-09-15",
      "condition": "جيدة",
      "mileage": 55000
    },
    {
      "id": 1002,
      "price": 88000,
      "soldDate": "2023-10-02",
      "condition": "ممتازة",
      "mileage": 40000
    }
  ],
  "valueScore": 87,
  "confidenceScore": 0.85
}
```

### كشف القيمة الخفية

يقوم بكشف القيمة الخفية المحتملة للسيارة.

**طلب HTTP:**
```
GET /api/ai/car/hidden-value/{carId}
```

**باراميترات URL:**
- `carId`: معرف السيارة

**رأس الطلب:**
```
Authorization: Bearer {token}
```

**نموذج الاستجابة:**
```json
{
  "carId": 123,
  "valueRatio": 1.18,
  "reasons": [
    "السعر الحالي أقل بكثير من القيمة السوقية المقدرة",
    "سوق هذا النوع من السيارات في ارتفاع",
    "عداد الكيلومترات أقل بكثير من المتوسط"
  ],
  "recommendedMaxBid": 92000,
  "confidenceScore": 0.82
}
```

## واجهة برمجة تطبيقات تحليل السوق

تُستخدم لتحليل اتجاهات سوق السيارات.

### تحليل اتجاهات السوق

يقوم بتحليل اتجاهات سوق السيارات لفئة معينة.

**طلب HTTP:**
```
GET /api/ai/market/trends
```

**باراميترات الاستعلام:**
- `make`: الماركة (اختياري)
- `model`: الموديل (اختياري)
- `year`: سنة الصنع (اختياري)
- `period`: فترة التحليل بالأشهر (افتراضي: 6)

**رأس الطلب:**
```
Authorization: Bearer {token}
```

**نموذج الاستجابة:**
```json
{
  "trendAnalysis": {
    "overallTrend": "rising",
    "priceChange": {
      "percentage": 3.5,
      "period": "6 months"
    },
    "demandLevel": "high",
    "supplyLevel": "medium",
    "seasonalityFactor": 1.02
  },
  "forecast": {
    "nextThreeMonths": {
      "priceChange": 2.1,
      "demandChange": 0.8
    },
    "confidence": 0.78
  },
  "topSellingModels": [
    {
      "make": "تويوتا",
      "model": "كامري",
      "year": 2020,
      "averagePrice": 87500,
      "demandScore": 92
    },
    {
      "make": "هوندا",
      "model": "اكورد",
      "year": 2019,
      "averagePrice": 82300,
      "demandScore": 88
    }
  ],
  "marketInsights": [
    "أسعار سيارات السيدان متوسطة الحجم تشهد ارتفاعًا مستمرًا",
    "الطلب على سيارات تويوتا المستعملة في أعلى مستوياته"
  ]
}
```

### كشف المزايدات المشبوهة

يقوم بتحليل أنماط المزايدة للكشف عن الأنشطة المشبوهة.

**طلب HTTP:**
```
POST /api/ai/market/suspicious-bids
```

**رأس الطلب:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**نموذج الطلب:**
```json
{
  "auctionId": 5001,
  "bids": [
    { "userId": 1001, "amount": 80000, "timestamp": "2023-10-15T14:23:15Z" },
    { "userId": 1002, "amount": 81000, "timestamp": "2023-10-15T14:25:20Z" },
    { "userId": 1003, "amount": 85000, "timestamp": "2023-10-15T14:28:45Z" }
  ]
}
```

**نموذج الاستجابة:**
```json
{
  "suspiciousActivityDetected": true,
  "suspiciousBids": [
    {
      "userId": 1002,
      "amount": 81000,
      "timestamp": "2023-10-15T14:25:20Z",
      "confidence": 0.89,
      "reasons": ["تزامن مع مزايدات أخرى", "نمط مزايدة غير معتاد"]
    }
  ],
  "userPatterns": {
    "1001": { "riskScore": 0.05, "bidPattern": "normal" },
    "1002": { "riskScore": 0.89, "bidPattern": "suspicious" },
    "1003": { "riskScore": 0.08, "bidPattern": "normal" }
  },
  "recommendedActions": [
    "مراقبة المستخدم 1002 في المزادات القادمة",
    "التحقق من صحة المزايدة رقم 81000"
  ]
}
```

## أمان واجهة برمجة التطبيقات

### المصادقة

جميع طلبات واجهة برمجة التطبيقات يجب أن تتضمن رأس `Authorization` باستخدام نوع `Bearer`:

```
Authorization: Bearer {token}
```

يتم إصدار الرمز المميز عند تسجيل الدخول، ويكون صالحًا لمدة محددة.

### حدود الاستخدام

لمنع إساءة استخدام الواجهة، تم تطبيق حدود طلبات:

- 100 طلب في الدقيقة لكل مستخدم
- 1000 طلب في اليوم لكل مستخدم

عند تجاوز هذه الحدود، سيتم رفض الطلبات مع رمز الاستجابة 429 (طلبات كثيرة جدًا).

### التعامل مع الأخطاء

في حالة حدوث خطأ، سيتم إرجاع رمز الاستجابة المناسب مع رسالة الخطأ بتنسيق JSON:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "وصف الخطأ بالتفصيل",
    "status": 400
  }
}
```

### أكواد الخطأ الشائعة

- `INVALID_TOKEN`: رمز المصادقة غير صالح أو منتهي الصلاحية
- `MISSING_PARAMETER`: معلمة مطلوبة مفقودة
- `RESOURCE_NOT_FOUND`: المورد المطلوب غير موجود
- `RATE_LIMIT_EXCEEDED`: تم تجاوز حد الاستخدام
- `INTERNAL_ERROR`: خطأ داخلي في الخادم

## ملاحظات ختامية

هذه الواجهات قابلة للتغيير والتحسين مع تطور المنصة. يرجى التحقق من أحدث إصدار من هذا التوثيق قبل التكامل. 
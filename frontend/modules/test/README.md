# 📋 وحدة اختبارات المزادات - Frontend Module

> **نقطة الدخول الموحّدة للـ Testing Module:** من جذر المشروع انظر [TestingModule/README.md](../../../TestingModule/README.md) (هيكل كامل، تشغيل، إضافة اختبارات).

## 📖 نظرة عامة

Module منفصل ومنظم للتعامل مع اختبارات المزادات من الواجهة الأمامية. يوفر API Client موحد، Hooks مخصصة، و Components جاهزة للاستخدام.

---

## 🔗 الوصول للصفحة

**رابط Dashboard:** [`/admin/auction-tests`](/admin/auction-tests)

### الأذونات المطلوبة

الصفحة متاحة فقط للمستخدمين الذين لديهم:
- ✅ صلاحيات **Super Admin** أو **Admin**
- ✅ صلاحية `auction_tests.view` على الأقل

### حساب للاختبار (Test Account)

للوصول إلى الصفحة، يمكنك استخدام الحسابات التالية (يتم إنشاؤها تلقائياً عند تشغيل `php artisan db:seed`):

```bash
# حساب Super Admin (لديه جميع الصلاحيات)
Email: superadmin@dasm.platform
Password: superadmin123

# حساب Admin (لديه صلاحيات اختبارات المزادات)
Email: admin@dasm.platform
Password: admin123
```

> **ملاحظة:** هذه الحسابات يتم إنشاؤها تلقائياً من `RolesAndPermissionsSeeder`. تأكد من تشغيل Seeder قبل محاولة الوصول للصفحة.

---

## 🏗️ البنية

```
frontend/modules/test/
├── api/
│   └── auctionTestsApi.ts        # API Client
├── hooks/
│   ├── useTestResults.ts         # جلب النتائج مع Pagination
│   ├── useTestRunner.ts          # تشغيل الاختبارات
│   └── useTestWebSocket.ts       # Real-time updates
├── components/
│   ├── TestSummaryCard.tsx       # بطاقة الملخص الإحصائي
│   ├── TestDataTable.tsx         # جدول النتائج
│   ├── TestDetailsModal.tsx      # نافذة التفاصيل
│   └── TestCard.tsx              # بطاقة نتيجة واحدة
├── types/
│   └── index.ts                  # TypeScript types
└── index.ts                      # Exports
```

---

## 🚀 الاستخدام السريع

### API Client

```typescript
import { auctionTestsApi } from '@/modules/test/api/auctionTestsApi';

// Get results with pagination
const { data, summary, pagination } = await auctionTestsApi.getResults({
  category: 'logic',
  page: 1,
  perPage: 15
});

// Run all tests
const results = await auctionTestsApi.runAll();

// Run specific test
const result = await auctionTestsApi.runCategory('logic');

// Delete result
await auctionTestsApi.delete(123);
```

### Hooks

#### `useTestResults` - جلب النتائج

```typescript
import { useTestResults } from '@/modules/test';

function MyComponent() {
  const { results, summary, pagination, loading, error, refetch } = useTestResults({
    category: 'logic',  // Optional: filter by category
    page: 1,            // Optional: page number
    perPage: 15         // Optional: results per page
  });

  if (loading) return <div>جاري التحميل...</div>;
  if (error) return <div>خطأ: {error}</div>;

  return <div>{/* Render results */}</div>;
}
```

#### `useTestRunner` - تشغيل الاختبارات

```typescript
import { useTestRunner } from '@/modules/test';

function TestRunner() {
  const { running, runAll, runCategory } = useTestRunner();

  const handleRunAll = async () => {
    const results = await runAll();
    // Handle results
  };

  return (
    <button onClick={handleRunAll} disabled={running}>
      {running ? 'جاري التشغيل...' : 'تشغيل جميع الاختبارات'}
    </button>
  );
}
```

#### `useTestWebSocket` - التحديثات اللحظية

```typescript
import { useTestWebSocket } from '@/modules/test';

function Dashboard() {
  const { connected, latestResult } = useTestWebSocket();

  useEffect(() => {
    if (latestResult) {
      // Auto-refresh when new result arrives
      refetch();
    }
  }, [latestResult]);

  return (
    <div>
      الحالة: {connected ? 'متصل' : 'غير متصل'}
    </div>
  );
}
```

### Components

#### `TestSummaryCard`

```typescript
import { TestSummaryCard } from '@/modules/test';

function Dashboard() {
  const { summary } = useTestResults();
  return <TestSummaryCard summary={summary} />;
}
```

**يعرض:**
- إجمالي النتائج
- عدد النتائج الناجحة/الفاشلة/المعلقة/قيد التشغيل

#### `TestDataTable`

```typescript
import { TestDataTable } from '@/modules/test';

function ResultsTable() {
  const { results, pagination, loading } = useTestResults();

  return (
    <TestDataTable
      results={results}
      pagination={pagination}
      loading={loading}
      onPageChange={setCurrentPage}
      onViewDetails={setSelectedTest}
      onDelete={handleDelete}
    />
  );
}
```

**المميزات:**
- عرض جميع النتائج في جدول
- التصفية حسب الفئة
- Pagination
- عرض التفاصيل / حذف

#### `TestDetailsModal`

```typescript
import { TestDetailsModal } from '@/modules/test';

function Details() {
  const [selectedTest, setSelectedTest] = useState<TestResult | null>(null);

  return (
    <TestDetailsModal
      test={selectedTest}
      open={!!selectedTest}
      onClose={() => setSelectedTest(null)}
    />
  );
}
```

**يعرض:**
- اسم الاختبار، الفئة، الحالة
- الرسالة والتفاصيل
- قائمة الأخطاء (إن وجدت)
- وقت التنفيذ والتواريخ

---

## 🔌 التحديثات اللحظية (Real-time Updates)

يستخدم **Pusher** للبث المباشر:

- **القناة:** `admin.auction-tests`
- **الحدث:** `AuctionTestResultUpdated`

```typescript
import { useTestWebSocket } from '@/modules/test';

function MyComponent() {
  const { connected, latestResult } = useTestWebSocket();

  useEffect(() => {
    if (latestResult) {
      // Auto-update UI when new result arrives
      refetch();
    }
  }, [latestResult]);
}
```

---

## 📊 Types

```typescript
// Test categories
enum TestCategory {
  LOGIC = 'logic',
  TRANSITIONS = 'transitions',
  PRICE_UPDATES = 'price_updates',
  STATE_CONSISTENCY = 'state_consistency'
}

// Test status
enum TestStatus {
  PASSED = 'passed',
  FAILED = 'failed',
  PENDING = 'pending',
  RUNNING = 'running'
}

// Test result
interface TestResult {
  id: number;
  test_name: string;
  test_category: TestCategory;
  status: TestStatus;
  message: string;
  details: Record<string, any>;
  errors: string[] | null;
  execution_time_ms: number;
  started_at: string;
  completed_at: string;
  created_at: string;
}

// Summary
interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  pending: number;
  running: number;
}
```

---

## ⚡ الأداء

- **Memoization:** استخدام `useMemo` و `useCallback` لتقليل Re-renders
- **Lazy Loading:** تحميل Components عند الحاجة
- **Optimized API:** Caching و debouncing
- **Lightweight:** Components صغيرة ومركزة

---

## 🔐 الأذونات

جميع API calls تتطلب:
- ✅ المصادقة (`auth:sanctum`)
- ✅ صلاحيات Admin أو Super Admin

الأذونات المطلوبة:
- `auction_tests.view` - عرض النتائج
- `auction_tests.view_details` - عرض التفاصيل
- `auction_tests.run` - تشغيل اختبار
- `auction_tests.run_all` - تشغيل جميع الاختبارات
- `auction_tests.delete` - حذف النتائج

---

## 📝 ملاحظات مهمة

1. **التحديثات اللحظية:** يتم بث النتائج عبر WebSocket لجميع المشرفين المتصلين
2. **معالجة الأخطاء:** جميع API calls تحتوي على معالجة أخطاء شاملة
3. **Type Safety:** دعم كامل لـ TypeScript
4. **Responsive:** جميع Components مصممة لتكون Responsive

---

## 🔗 المراجع

- **Backend Module:** `backend/Modules/Test/README.md`
- **Dashboard Page:** `frontend/app/admin/auction-tests/page.tsx`

---

**آخر تحديث:** 23 يناير 2026  
**الإصدار:** 1.0.0

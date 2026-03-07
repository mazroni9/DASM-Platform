# المرجع النهائي للصفحة الرئيسية والواجهة

**آخر تحديث:** 6 مارس 2025

هذا الملف هو المرجع المعتمد لبنية الصفحة الرئيسية ومصادر الواجهة. أي تعديل لاحق يجب أن يلتزم به. **حدّث تاريخ «آخر تحديث» بعد أي تغيير بنيوي على الصفحة الرئيسية أو مصادر الواجهة.**

---

## ⚠️ قبل أي تعديل على الواجهة

1. **ارجع إلى هذا الملف** — `frontend/docs/HOMEPAGE-SOURCE-OF-TRUTH.md`
2. **حدّد الملف المسموح تعديله** — من القسم 6 أدناه فقط
3. **لا تنشئ نسخة جديدة** من component موجود (هيدر، فوتر، قسم)
4. **لا تضف مصدر تنقل أو لون جديد** خارج المصدر المعتمد (siteConfig.ts، globals.css)
5. **إذا احتجت تعديلًا كبيرًا** — حدّث هذا الملف المرجعي بعد التنفيذ

---

## 1. الخريطة النهائية للصفحة الرئيسية

```
app/layout.tsx
├── Navbar (components/shared/Navbar.tsx)
└── children
    └── app/page.tsx
        ├── Hero (مضمّن في page.tsx)
        ├── section → MarketTypeNav (components/shared/MarketTypeNav.tsx)
        ├── LiveBroadcastSection (مضمّن في page.tsx)
        ├── StatsSection (مضمّن في page.tsx)
        ├── BenefitsSection (مضمّن في page.tsx)
        └── Footer (components/shared/Footer.tsx)
            └── navLinks ← FOOTER_NAV_LINKS (lib/siteConfig.ts)
```

| الترتيب | القسم | الملف الفعلي |
|---------|-------|--------------|
| 0 | Navbar | `app/layout.tsx` → `components/shared/Navbar.tsx` |
| 1 | Hero | `app/page.tsx` (مضمّن) |
| 2 | بطاقات الأسواق | `components/shared/MarketTypeNav.tsx` |
| 3 | البث المباشر | `app/page.tsx` — LiveBroadcastSection |
| 4 | الإحصائيات | `app/page.tsx` — StatsSection |
| 5 | المزايا | `app/page.tsx` — BenefitsSection |
| 6 | Footer | `components/shared/Footer.tsx` |

---

## 2. مصدر الهيدر

- **الملف الوحيد:** `components/shared/Navbar.tsx`
- **الاستخدام:** `app/layout.tsx` يستورد Navbar مباشرة
- **لا يوجد** هيدر بديل أو مكرر (مثل Header.tsx أو exhibitor/Header للصفحة الرئيسية)

---

## 3. مصدر الفوتر

- **الملف الوحيد:** `components/shared/Footer.tsx`
- **الاستخدام:** `app/page.tsx` يستورد Footer
- **روابط التنقل:** من `lib/siteConfig.ts` → `FOOTER_NAV_LINKS`

---

## 4. مصدر التنقل

- **الملف الوحيد:** `lib/siteConfig.ts`
- **المتغير:** `FOOTER_NAV_LINKS`
- **الاستخدام:** `Footer.tsx` يستورد ويستخدم FOOTER_NAV_LINKS
- **إضافة أو تعديل رابط:** عدّل `FOOTER_NAV_LINKS` في siteConfig.ts فقط

---

## 5. مصدر الألوان

- **الملف الرئيسي:** `app/globals.css`
- **المتغيرات:** `--navbar-bg`, `--color-primary`, `--color-secondary`, `--color-foreground`, `--color-background`
- **Tailwind:** يستخدم هذه المتغيرات عبر theme في `tailwind.config.js`
- **تعديل الألوان:** عدّل globals.css (متغيرات :root و .dark) فقط

---

## 6. الملفات المسموح بتعديلها للصفحة الرئيسية

| الملف | الغرض |
|-------|-------|
| `app/layout.tsx` | الهيكل العام، Navbar |
| `app/page.tsx` | المحتوى، الأقسام، استيراد Footer و MarketTypeNav |
| `components/shared/Navbar.tsx` | الهيدر والتنقل العلوي |
| `components/shared/Footer.tsx` | الفوتر وروابطه |
| `components/shared/MarketTypeNav.tsx` | بطاقات الأسواق |
| `lib/siteConfig.ts` | روابط التنقل، ألوان العلامة التجارية |
| `app/globals.css` | متغيرات الألوان والثيم |

---

## 7. قاعدة منع التكرار

1. **لا تنشئ** مكونات بديلة للهيدر أو الفوتر أو أقسام الصفحة الرئيسية.
2. **أي section جديد** يُضاف إما:
   - مضمّنًا داخل `page.tsx`، أو
   - كمكوّن جديد مستورد من `page.tsx` فقط.
3. **لا تترك** نسخًا قديمة موازية عند التعديل — احذف أو عطّل القديم قبل إضافة الجديد.
4. **روابط التنقل:** من `siteConfig.ts` فقط — لا تكرر مصفوفة الروابط في مكونات أخرى.
5. **الألوان:** استخدم `text-primary`, `text-secondary`, `text-foreground`, `bg-primary` إلخ — لا تستخدم hex ثابت إلا للعلامة التجارية المحددة (مثل #009345 لـ DASMe).

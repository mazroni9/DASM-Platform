# تشخيص وصول استوديو مجلس السوق (Council Studio Access)

**الفرع:** `diagnose/council-studio-access`  
**التاريخ:** 2026-03

---

## 1. ملخص التشخيص

| السؤال | الإجابة |
|--------|---------|
| **هل المشكلة frontend visibility أم backend permissions؟** | **Backend permissions** (مع انعكاس على الواجهة) |
| **السبب الجذري الأرجح** | استخدام سياق organization_id فقط عند جلب الصلاحيات، مما يستبعد أدوار مجلس السوق المُسندة في سياق platform org |
| **أقل إصلاح مطلوب** | دمج صلاحيات سياق platform_org مع صلاحيات organization_id الحالية في safePermissions و getUserPermissions |

---

## 2. سلسلة التشغيل المُتتبعة

### 2.1 كيف تُقرر الواجهة إظهار رابط استوديو مجلس السوق؟

- **الملف:** `frontend/app/dashboard/layout.tsx`
- **المنطق:** `canAccessCouncilStudio = canAny(COUNCIL_PERMISSIONS)` حيث `COUNCIL_PERMISSIONS` تشمل `council.studio.access` وغيره
- **المصدر:** `usePermission()` ← `authStore.user.permissions`

### 2.2 من أين تأتي صلاحيات المستخدم؟

- **بعد Login:** AuthController يرجع `user.permissions` عبر `getUserPermissions()`
- **بعد fetchProfile:** UserController يرجع `permissions` عبر `safePermissions()`
- **المسار الرئيسي للواجهة:** `GET /api/user/profile` → `UserController::profile` → `safePermissions()`

### 2.3 safePermissions و getUserPermissions

- **الموقع:** `UserController::safePermissions` و `AuthController::getUserPermissions`
- **المنطق الحالي:**
  ```
  teamId = user.organization_id
  if (!teamId) teamId = platform_org.id
  setPermissionsTeamId(teamId)
  return user.getAllPermissions()
  ```

- **المشكلة:** عند وجود `organization_id` (مثل dealer، venue owner)، يُستخدم سياق منظمة المستخدم فقط. أدوار مجلس السوق (`council_writer`, `council_manager`, ...) مُسندة في سياق **platform_org**، لذلك لا تظهر في `getAllPermissions()` عند استخدام سياق المنظمة الأخرى.

### 2.4 Spatie Permission مع الفرق (teams)

- `model_has_roles` يحتوي على `organization_id` لكل تعيين دور
- الأدوار مثل `council_manager` مُعرّفة مع `organization_id = platform_org.id`
- عند `setPermissionsTeamId(dealer_org)` لا يُرجع Spatie الأدوار المُسندة في `platform_org`

### 2.5 Seeder وأدوار مجلس السوق

- `RolesAndPermissionsSeeder` ينشئ أدوار council ويُسنِدها في سياق `platform_org`
- `mazroni@gmail.com` يُمنح `council_manager` مع `teamId = mazroni.organization_id ?? platform_org.id`
- إذا كان لدى mazroni `organization_id` لمنظمة أخرى، التخصيص يستخدم تلك المنظمة؛ لكن الأدوار نفسها (`council_*`) مُعرّفة في platform_org فقط

---

## 3. الملفات والمناطق المتأثرة

| الملف | الدور |
|-------|-------|
| `backend/app/Http/Controllers/UserController.php` | `safePermissions()` — مصدر الصلاحيات للواجهة |
| `backend/app/Http/Controllers/AuthController.php` | `getUserPermissions()` — صلاحيات login/refresh |
| `frontend/app/dashboard/layout.tsx` | إظهار/إخفاء رابط استوديو مجلس السوق |
| `frontend/hooks/usePermission.ts` | قراءة `user.permissions` |
| `backend/database/seeders/RolesAndPermissionsSeeder.php` | إنشاء الأدوار وتخصيصها |
| `backend/app/Http/Middleware/SetSpatieTeamContext.php` | تحديد سياق الفريق للـ API (لا يؤثر على safePermissions) |

---

## 4. الإصلاح المقترح (minimal)

**الخطوة:** دمج صلاحيات سياق platform_org مع صلاحيات سياق المستخدم الحالي.

- إذا كان `organization_id` موجودًا، نجلب الصلاحيات مرتين: مرة لسياق المستخدم، ومرة لـ platform_org، ثم ندمج النتائج بدون تكرار.
- إذا كان `organization_id` فارغًا، نبقى على المنطق الحالي (platform_org فقط).

**الأمان:** زيادة صلاحيات فقط (لا نزيل أي صلاحية). المستخدمون الذين لديهم بالفعل أدوار council في platform_org سيظهر لهم الرابط بعد الإصلاح.

---

## 5. نوع الإصلاح

| الخيار | ينطبق؟ |
|--------|--------|
| Seeder / role assignment | لا — الأدوار والتخصيص موجودان |
| Fallback fix | نعم — دمج صلاحيات platform_org مع organization_id |
| UI condition fix | لا — شرط الواجهة صحيح، المشكلة في البيانات المُرجَعة |

---

## 6. درجة الأمان

- **دفعة صغيرة منفصلة:** نعم؛ التعديل محصور في منطقتين (safePermissions و getUserPermissions)
- **لا يمس:** shipping، wallet، dashboard stats، auth rewrite، Council Studio نفسه
- **خطر محتمل:** لا؛ نضيف فقط صلاحيات، دون حذف أو تغيير صلاحيات أخرى

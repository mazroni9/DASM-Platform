# DASM — محرك الموافقات التشغيلية (مصدر الحقيقة الوحيد)

كل ما يلي يبقى داخل **DASM** فقط: إنشاء طلبات الموافقة، التصنيف، الحالة، عضوية مجموعة الموافقات، سجل التدقيق، قرارات القبول/الرفض، والإشعارات (بريد/قنوات Laravel).

**DasmAdminPanel** (أو أي BFF) يستهلك الـ API عبر **خادم وسيط** باستخدام `Authorization: Bearer <token>` لنفس مستخدم Sanctum المعتمد في DASM. لا يُعرَّض التوكن في المتصفح لموقع آخر دون ضوابط.

## المصادقة

- Middleware: `auth:sanctum` + `set.organization`
- رأس: `Authorization: Bearer {personal_access_token}` و`Accept: application/json`

## الصلاحيات (ملخص)

| القدرة | من يملكها |
|--------|-----------|
| إدارة عضوية المجموعة (إضافة/تعديل/حذف) | `super_admin` أو `admin` فقط (`admin_or_super_admin`) |
| طابور الموافقات + تفاصيل + سجل + قبول/رفض | `super_admin` أو `admin` **أو** عضو **نشط** في `approval_group_members` مع `can_review_requests` ونوع مستخدم مؤهل (مشرف/مبرمج/إداري)، مع أعلام `can_approve_business_accounts` / `can_approve_council_requests` حسب نوع الطلب (ما لم يكن المستخدم `admin`/`super_admin`) |

## Endpoints

### القدرات للمستخدم الحالي

`GET /api/admin/approval-requests/capabilities`

- يتطلب: `approval.queue`
- استجابة `data`: `can_manage_group`, `can_access_queue`, `can_approve_business`, `can_approve_council`

### طابور الطلبات

`GET /api/admin/approval-requests`  
Query اختياري: `status`, `request_type`, `per_page`

### تفاصيل طلب (يشمل سجلًا مدمجًا حتى 500 سجل)

`GET /api/admin/approval-requests/{id}`

### سجل الطلب فقط

`GET /api/admin/approval-requests/{id}/logs`

### قبول / رفض

`POST /api/admin/approval-requests/{id}/approve`  
`POST /api/admin/approval-requests/{id}/reject` — جسم JSON اختياري: `{ "notes": "..." }`

### قراءة أعضاء مجموعة الموافقات

`GET /api/admin/approval-group`  
- يتطلب: `approval.queue`

### إدارة المجموعة (DASM فقط)

`POST /api/admin/approval-group` — `{ "user_id": <int> }`  
`PUT /api/admin/approval-group/{id}` — حقول اختيارية: `is_active`, `can_review_requests`, `can_approve_business_accounts`, `can_approve_council_requests`  
`DELETE /api/admin/approval-group/{id}`

- تتطلب: `admin_or_super_admin`

## الإيميلات والإشعارات

تُرسل عبر نماذج Laravel `Notification` داخل `ApprovalRequestWorkflowService` وخدمات التدقيق — **لا** تُنقل إلى AdminPanel.

## إنشاء طلبات جديدة (داخل DASM)

- تدفق الحسابات التجارية بعد التحقق من البريد: `ApprovalRequestWorkflowService` (إنشاء + إشعار الأعضاء النشطين + لوج)
- طلبات مجلس السوق: `POST /api/council-studio/access-request` (يستدعي نفس الخدمة)

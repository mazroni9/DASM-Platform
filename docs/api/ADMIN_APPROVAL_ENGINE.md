# DASM — محرك الموافقات التشغيلية (مصدر الحقيقة الوحيد)

كل ما يلي يبقى داخل **DASM** فقط: إنشاء طلبات الموافقة، التصنيف، الحالة، عضوية مجموعة الموافقات، سجل التدقيق، قرارات القبول/الرفض، والإشعارات (بريد/قنوات Laravel).

**DasmAdminPanel** (أو أي BFF) يستهلك الـ API عبر **خادم وسيط** باستخدام `Authorization: Bearer <token>` لنفس مستخدم Sanctum المعتمد في DASM. لا يُعرَّض التوكن في المتصفح لموقع آخر دون ضوابط.

## المصادقة

- Middleware: `auth:sanctum` + `set.organization`
- رأس: `Authorization: Bearer {personal_access_token}` و`Accept: application/json`
- **تتبع مصدر القرار (اختياري):** `X-Decision-Source` — قيمة `1–64` حرفًا من `[a-z0-9._-]` (مثلاً `dasm_api`، `bff_admin_panel`). تُسجَّل في `meta` لسجلات القرار. الافتراضي: `dasm_api`.

## الصلاحيات (ملخص)

| القدرة | من يملكها |
|--------|-----------|
| **قراءة** قائمة أعضاء `GET /api/admin/approval-group` | `super_admin` أو `admin` فقط (`admin_or_super_admin`) — **لا** يصل المراجع التشغيلي لمجرد عضويته في المجموعة |
| طابور الموافقات + تفاصيل + سجل + قبول/رفض | `User::isAdmin()` (**admin** أو **super_admin**) **أو** صف في `approval_group_members` مع `is_active` و`can_review_requests` — **لا يكفي** نوع مستخدم (مشرف/مبرمج) بدون عضوية فعلية |

قرار القبول/الرفض على طلب **معلّق**: يتطلب صلاحية `admin`/`super_admin` **أو** عضوًا نشطًا مع `can_approve_business_accounts` / `can_approve_council_requests` حسب `request_type` (كما في `ApprovalRequestWorkflowService`).

## عقد `GET /api/admin/approval-requests/capabilities`

يتطلب middleware `approval.queue`.

حقول `data` (ثابتة + توافق خلفي):

| الحقل | المعنى |
|--------|--------|
| `can_access_queue` | يصل للطابور والتفاصيل |
| `can_manage_group` | يصل لإدارة عضوية المجموعة (POST/PUT/DELETE) |
| `can_approve_business_accounts` | يمكنه اعتماد/رفض طلبات `business_account` (أو admin) |
| `can_approve_council_requests` | يمكنه اعتماد/رفض `council_permission` (أو admin) |
| `is_approval_group_member` | يوجد له صف في `approval_group_members` |
| `approval_member_active` | الصف نشط و`can_review_requests` |
| `can_approve_business` | نفس قيمة `can_approve_business_accounts` (قديم) |
| `can_approve_council` | نفس قيمة `can_approve_council_requests` (قديم) |

## Endpoints

### طابور الطلبات

`GET /api/admin/approval-requests`  
Query اختياري: `status`, `request_type`, `per_page`

### تفاصيل طلب (حمولة غرفة المعالجة)

`GET /api/admin/approval-requests/{id}`

- `data.payload`، العلاقات الأساسية، `resolution_*`
- `decision`: `can_approve`, `can_reject`, `blocked_reason`, `status` للمستخدم الحالي
- `target_user_summary`: ملخص سريع للمستهدف
- `audit_summary`: `log_count`, `logs_included`, `logs_truncated`
- `logs`: آخر **100** سجلًا زمنيًا (إن زاد العدد، السجل الكامل عبر `GET .../logs`)

### سجل الطلب كاملًا

`GET /api/admin/approval-requests/{id}/logs`

### قبول / رفض (idempotent + تعارض)

`POST /api/admin/approval-requests/{id}/approve`  
`POST /api/admin/approval-requests/{id}/reject` — جسم JSON اختياري: `{ "notes": "..." }`

- **قفل صف** `lockForUpdate` داخل معاملة لتقليل race conditions.
- **تكرار نفس القرار:** طلب معتمد + طلب `approve` مرة أخرى → `200` مع `idempotent: true` دون إعادة إشعار أو تطبيق جانبي مكرر.
- **تعارض:** اعتماد طلب مرفوض (أو العكس) → `409` وتسجيل `invalid_decision_attempt` في السجل.

### قراءة أعضاء مجموعة الموافقات

`GET /api/admin/approval-group`  
- يتطلب: **`admin_or_super_admin`** فقط

### إدارة المجموعة (DASM فقط)

`POST /api/admin/approval-group` — `{ "user_id": <int> }`  
`PUT /api/admin/approval-group/{id}`  
`DELETE /api/admin/approval-group/{id}`

- تتطلب: `admin_or_super_admin`

## سجل التدقيق (قرارات)

أحداث القرار (`request_approved` / `request_rejected`) تُخزّن في `meta` (JSON) حقولًا منها:

- `actor_id`, `actor_type`, `actor_role_context` (`admin_or_super_admin` | `approval_group_member`)
- `previous_status`, `new_status`
- `decision_source` (من رأس `X-Decision-Source` أو الافتراضي)

أحداث إضافية: `decision_idempotent`, `invalid_decision_attempt`.

## الإيميلات والإشعارات

تُرسل من DASM فقط عند **أول** انتقال فعلي من `pending` إلى حالة نهائية — لا تُعاد عند الاستجابة idempotent.

## إنشاء طلبات جديدة (داخل DASM)

- تدفق الحسابات التجارية بعد التحقق من البريد: `ApprovalRequestWorkflowService`
- طلبات مجلس السوق: `POST /api/council-studio/access-request`

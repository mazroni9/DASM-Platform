export type PermissionModule = {
  module: string;
  permissions: string[];
};

export const permissionsByModule: PermissionModule[] = [
  {
    module: "المزادات",
    permissions: [
      "عرض المزادات",
      "إنشاء مزاد",
      "بدء مزاد مباشر",
      "إغلاق مزاد قسري",
      "تعديل بعد الإغلاق",
    ],
  },
  {
    module: "المحفظة",
    permissions: ["عرض الرصيد", "تعديل الرصيد", "إشعار السحب", "قفل حساب"],
  },
  {
    module: "المعارض",
    permissions: [
      "عرض لوحة التحكم",
      "دعوة تجار",
      "إدارة المخزون",
      "عرض الماليات",
    ],
  },
  {
    module: "غرفة التحكم",
    permissions: ["عرض كل البث", "تعيين مشغل", "تجاوز المزاد"],
  },
];


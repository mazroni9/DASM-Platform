"use client";

import LoadingLink from "@/components/LoadingLink";
import ApprovalRequestsQueue from "@/components/admin/ApprovalRequestsQueue";

export default function ControlRoomApprovalRequestsPage() {
  return (
    <div className="container mx-auto p-6 space-y-4 rtl">
      <LoadingLink
        href="/admin/control-room"
        className="text-sm text-primary hover:underline inline-block"
      >
        ← العودة لغرفة المعالجة
      </LoadingLink>
      <ApprovalRequestsQueue />
    </div>
  );
}

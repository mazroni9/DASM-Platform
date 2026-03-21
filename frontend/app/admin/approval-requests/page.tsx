import { redirect } from "next/navigation";

export default function LegacyApprovalRequestsRedirect() {
  redirect("/admin/control-room/approval-requests");
}

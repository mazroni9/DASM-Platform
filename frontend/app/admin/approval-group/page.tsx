import { redirect } from "next/navigation";

export default function LegacyApprovalGroupRedirect() {
  redirect("/admin/control-room/approval-group");
}

import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/lib/auth";

// Middleware đã chặn khi chưa có cookie; ở đây kiểm tra thêm user còn tồn tại trong DB.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <AppShell username={user.username}>{children}</AppShell>;
}

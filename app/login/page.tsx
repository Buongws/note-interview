import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  // Đã đăng nhập (và user còn tồn tại) thì về trang chủ
  if (await getCurrentUser()) redirect("/");
  return <LoginForm />;
}

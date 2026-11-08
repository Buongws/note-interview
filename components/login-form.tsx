"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpenText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { send } from "@/lib/fetcher";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await send("/api/auth/login", "POST", { username });
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BookOpenText className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Interview Note</h1>
          <p className="text-sm text-muted-foreground">
            Nhập username để bắt đầu. Chưa có thì tài khoản sẽ được tạo tự động.
          </p>
        </div>
        <Input
          autoFocus
          autoComplete="username"
          placeholder="Username của bạn"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="h-11"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" className="h-11 w-full" disabled={loading || username.trim().length < 2}>
          {loading ? "Đang vào…" : "Tiếp tục"}
        </Button>
      </form>
    </main>
  );
}

"use client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { send } from "@/lib/fetcher";

export function UserMenu({ username }: { username: string }) {
  const router = useRouter();
  async function logout() {
    await send("/api/auth/logout", "POST");
    router.replace("/login");
    router.refresh();
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button aria-label="Tài khoản" className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold uppercase text-primary transition-transform hover:scale-105">
          {username.slice(0, 1)}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48">
        <div className="px-2 py-1.5 text-xs text-muted-foreground">Đăng nhập là <b className="text-foreground">@{username}</b></div>
        <DropdownMenuItem onSelect={logout}><LogOut className="h-4 w-4" /> Đăng xuất</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/sidebar";
import { CommandPalette } from "@/components/command-palette";
import { cn } from "@/lib/utils";

/** Khung chung: sidebar cố định (desktop) / drawer (mobile) + phím tắt Cmd/Ctrl+K. */
export function AppShell({ username, children }: { username: string; children: React.ReactNode }) {
  const [drawer, setDrawer] = useState(false);
  const [search, setSearch] = useState(false);
  const pathname = usePathname();

  // Tải sẵn bundle editor (BlockNote + shiki) lúc trình duyệt rảnh -> mở note không bị chờ
  useEffect(() => {
    const idle = (window as unknown as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    const run = () => void import("@/components/block-editor");
    if (idle) idle(run); else setTimeout(run, 2000);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearch((s) => !s);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r md:block">
        <Sidebar username={username} onSearch={() => setSearch(true)} />
      </aside>

      {/* Mobile drawer */}
      <div className={cn("fixed inset-0 z-40 md:hidden", !drawer && "pointer-events-none")}>
        <div className={cn("absolute inset-0 bg-black/40 transition-opacity", drawer ? "opacity-100" : "opacity-0")} onClick={() => setDrawer(false)} />
        <aside className={cn("absolute inset-y-0 left-0 w-72 max-w-[85%] border-r transition-transform", drawer ? "translate-x-0" : "-translate-x-full")}>
          <Sidebar username={username} onNavigate={() => setDrawer(false)} onSearch={() => { setDrawer(false); setSearch(true); }} />
        </aside>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 items-center justify-between border-b px-3 md:hidden">
          <Button variant="ghost" size="icon" aria-label="Mở menu" onClick={() => setDrawer(true)}><Menu className="h-5 w-5" /></Button>
          <span className="text-sm font-semibold">Interview Note</span>
          <Button variant="ghost" size="icon" aria-label="Tìm kiếm" onClick={() => setSearch(true)}><Search className="h-5 w-5" /></Button>
        </header>
        <main key={pathname} className="page-enter flex-1 overflow-y-auto">{children}</main>
      </div>

      <CommandPalette open={search} onOpenChange={setSearch} />
    </div>
  );
}

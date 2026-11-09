"use client";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { AppHeader } from "@/components/app-header";
import { CommandPalette } from "@/components/command-palette";
import { cn } from "@/lib/utils";

const SIDEBAR_KEY = "sidebar-collapsed";

/** Khung chung: header + sidebar (thu gọn mượt trên desktop, drawer trên mobile). */
export function AppShell({ username, children }: { username: string; children: React.ReactNode }) {
  const [drawer, setDrawer] = useState(false);
  const [search, setSearch] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  // Khôi phục trạng thái sidebar sau mount (tránh lệch hydration)
  useEffect(() => {
    try { setCollapsed(localStorage.getItem(SIDEBAR_KEY) === "1"); } catch {}
  }, []);

  const toggleSidebar = useCallback(() => {
    setCollapsed((c) => {
      try { localStorage.setItem(SIDEBAR_KEY, c ? "0" : "1"); } catch {}
      return !c;
    });
  }, []);

  // Phím tắt: Cmd/Ctrl+K tìm kiếm, Cmd/Ctrl+\ thu gọn sidebar, Esc đóng drawer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") { e.preventDefault(); setSearch((s) => !s); }
      if (mod && e.key === "\\") { e.preventDefault(); toggleSidebar(); }
      if (e.key === "Escape") setDrawer(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleSidebar]);

  // Khoá cuộn nền khi drawer mở
  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawer]);

  // Tải sẵn bundle editor lúc trình duyệt rảnh -> mở note không bị chờ
  useEffect(() => {
    const idle = (window as unknown as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    const run = () => void import("@/components/block-editor");
    if (idle) idle(run); else setTimeout(run, 2000);
  }, []);

  const openSearch = useCallback(() => setSearch(true), []);

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Desktop sidebar: animate width; nội dung giữ cố định 16rem nên không bị reflow/giật chữ */}
      <aside
        inert={collapsed}
        className={cn(
          "hidden shrink-0 overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(.4,0,.2,1)] md:block",
          collapsed ? "w-0" : "w-64"
        )}
      >
        <div className={cn("h-full w-64 border-r transition-opacity duration-200", collapsed ? "opacity-0" : "opacity-100")}>
          <Sidebar username={username} onSearch={openSearch} />
        </div>
      </aside>

      {/* Mobile drawer */}
      <div className={cn("fixed inset-0 z-40 md:hidden", !drawer && "pointer-events-none")} inert={!drawer}>
        <div
          className={cn("absolute inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity duration-300", drawer ? "opacity-100" : "opacity-0")}
          onClick={() => setDrawer(false)}
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 w-72 max-w-[85%] border-r shadow-2xl transition-transform duration-300 ease-[cubic-bezier(.32,.72,0,1)]",
            drawer ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <Sidebar username={username} onNavigate={() => setDrawer(false)} onSearch={() => { setDrawer(false); setSearch(true); }} />
        </aside>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          username={username}
          collapsed={collapsed}
          onToggleSidebar={toggleSidebar}
          onOpenDrawer={() => setDrawer(true)}
          onSearch={openSearch}
        />
        <main key={pathname} className="page-enter safe-b flex-1 overflow-y-auto">{children}</main>
      </div>

      <CommandPalette open={search} onOpenChange={setSearch} />
    </div>
  );
}

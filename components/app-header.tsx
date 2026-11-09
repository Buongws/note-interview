"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { useTopics } from "@/lib/hooks";

interface Props {
  username: string;
  collapsed: boolean;
  onToggleSidebar: () => void; // desktop: thu gọn / mở rộng
  onOpenDrawer: () => void; // mobile
  onSearch: () => void;
}

/** Header cố định: nút sidebar · breadcrumb · tìm kiếm · theme · tài khoản. */
export function AppHeader({ username, collapsed, onToggleSidebar, onOpenDrawer, onSearch }: Props) {
  const pathname = usePathname();
  const { data: topics } = useTopics();

  // Breadcrumb suy ra từ URL
  const crumbs: { label: string; href?: string }[] = [];
  if (pathname === "/") crumbs.push({ label: "Dashboard" });
  else if (pathname.startsWith("/topics/")) {
    const t = topics?.find((x) => x._id === pathname.split("/")[2]);
    crumbs.push({ label: t ? `${t.icon} ${t.name}` : "Chủ đề" });
  } else if (pathname.startsWith("/notes/")) crumbs.push({ label: "Ghi chú" });
  else if (pathname === "/review") crumbs.push({ label: "Ôn tập" });
  else if (pathname === "/draw") crumbs.push({ label: "Bảng vẽ" });
  else if (pathname.startsWith("/draw/")) crumbs.push({ label: "Bảng vẽ", href: "/draw" }, { label: "Bản vẽ" });

  return (
    <header className="flex h-12 shrink-0 items-center gap-1 border-b bg-background/80 px-2 backdrop-blur sm:px-3">
      <Button variant="ghost" size="icon" className="md:hidden" aria-label="Mở menu" onClick={onOpenDrawer}>
        <Menu className="h-5 w-5" />
      </Button>
      <Button variant="ghost" size="icon" className="hidden md:inline-flex" onClick={onToggleSidebar}
        aria-label={collapsed ? "Mở sidebar" : "Thu gọn sidebar"} title={`${collapsed ? "Mở" : "Thu gọn"} sidebar (Ctrl/⌘ + \\)`}>
        {collapsed ? <PanelLeftOpen className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
      </Button>

      <nav aria-label="Breadcrumb" className="ml-1 flex min-w-0 items-center gap-1 text-sm">
        {crumbs.map((c, i) => (
          <span key={i} className="flex min-w-0 items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
            {c.href ? (
              <Link href={c.href} className="truncate text-muted-foreground hover:text-foreground">{c.label}</Link>
            ) : (
              <span className="truncate font-medium">{c.label}</span>
            )}
          </span>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-1">
        <button
          onClick={onSearch}
          className="hidden h-8 items-center gap-2 rounded-md border bg-muted/50 px-2.5 text-xs text-muted-foreground transition-colors hover:bg-accent sm:flex"
        >
          <Search className="h-3.5 w-3.5" /> Tìm kiếm
          <kbd className="rounded border bg-background px-1.5 text-[10px]">⌘K</kbd>
        </button>
        <Button variant="ghost" size="icon" className="sm:hidden" aria-label="Tìm kiếm" onClick={onSearch}>
          <Search className="h-[18px] w-[18px]" />
        </Button>
        <ThemeToggle />
        <UserMenu username={username} />
      </div>
    </header>
  );
}

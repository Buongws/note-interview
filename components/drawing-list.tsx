"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { MoreHorizontal, PenTool, Plus, Shapes, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/empty-state";
import { useConfirm } from "@/components/confirm";
import { fetcher, send } from "@/lib/fetcher";
import { timeAgo } from "@/lib/utils";
import type { DrawingDTO } from "@/types";

export function DrawingList() {
  const router = useRouter();
  const confirm = useConfirm();
  const { data, isLoading, mutate } = useSWR<DrawingDTO[]>("/api/drawings", fetcher);
  const [creating, setCreating] = useState(false);

  async function create() {
    setCreating(true);
    try {
      const d = await send<DrawingDTO>("/api/drawings", "POST", { title: "" });
      router.push(`/draw/${d._id}`);
    } finally {
      setCreating(false);
    }
  }

  async function remove(d: DrawingDTO) {
    const ok = await confirm({ title: `Xoá "${d.title || "Bản vẽ không tên"}"?`, description: "Không thể hoàn tác.", confirmText: "Xoá", danger: true });
    if (!ok) return;
    await mutate(
      async () => { await send(`/api/drawings/${d._id}`, "DELETE"); return undefined; },
      { optimisticData: (cur) => (cur ?? []).filter((x) => x._id !== d._id), populateCache: false, revalidate: false }
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bảng vẽ</h1>
          <p className="text-sm text-muted-foreground">Vẽ sơ đồ, kiến trúc hệ thống, ghi chú tay — tự động lưu.</p>
        </div>
        <Button onClick={create} disabled={creating}><Plus className="h-4 w-4" /> Bản vẽ mới</Button>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />)}</div>
      ) : !data?.length ? (
        <EmptyState emoji="🎨" title="Chưa có bản vẽ nào" description="Tạo bản vẽ đầu tiên để phác thảo System Design hay sơ đồ luồng.">
          <Button onClick={create} disabled={creating}><Plus className="h-4 w-4" /> Bản vẽ mới</Button>
        </EmptyState>
      ) : (
        <div className="stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((d) => (
            <div key={d._id} className="group relative flex h-32 flex-col justify-between rounded-lg border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <Link href={`/draw/${d._id}`} className="absolute inset-0 rounded-lg" aria-label={d.title || "Bản vẽ không tên"} />
              <div className="pointer-events-none flex items-center gap-2">
                <PenTool className="h-4 w-4 shrink-0 text-muted-foreground" />
                <h3 className="truncate text-sm font-medium">{d.title || "Bản vẽ không tên"}</h3>
              </div>
              <div className="pointer-events-none flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Shapes className="h-3.5 w-3.5" /> {d.shapes} đối tượng</span>
                <span>{timeAgo(d.updatedAt)}</span>
              </div>
              <div className="absolute right-2 top-2 z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button aria-label="Tuỳ chọn" className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-accent md:opacity-0 md:group-hover:opacity-100 data-[state=open]:opacity-100">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem danger onSelect={() => remove(d)}><Trash2 className="h-4 w-4" /> Xoá</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import useSWR, { mutate } from "swr";
import { useTheme } from "next-themes";
import { ArrowLeft, Check, Loader2, TriangleAlert } from "lucide-react";
import "@excalidraw/excalidraw/index.css";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { fetcher, send } from "@/lib/fetcher";

// Excalidraw rất nặng và chỉ chạy ở client -> tải riêng khi vào trang vẽ
const Excalidraw = dynamic(async () => (await import("@excalidraw/excalidraw")).Excalidraw, {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Đang tải bảng vẽ…</div>,
});

interface Drawing {
  _id: string;
  title: string;
  data?: { elements?: unknown[]; appState?: Record<string, unknown>; files?: Record<string, unknown> };
}
type SaveState = "idle" | "dirty" | "saving" | "saved" | "error" | "toolarge";
const SAVE_MS = 1500;

type El = { version: number; isDeleted?: boolean; fileId?: string | null; type: string };

export function DrawingEditor({ drawingId }: { drawingId: string }) {
  const { data, error, isLoading } = useSWR<Drawing>(`/api/drawings/${drawingId}`, fetcher, {
    revalidateOnFocus: false, revalidateOnReconnect: false,
  });
  if (isLoading) return <div className="p-8"><div className="h-8 w-48 animate-pulse rounded bg-muted" /></div>;
  if (error || !data) {
    return <div className="p-8"><EmptyState emoji="🤷" title="Không tìm thấy bản vẽ"><Button asChild><Link href="/draw">Về danh sách</Link></Button></EmptyState></div>;
  }
  return <Board key={data._id} drawing={data} />;
}

function Board({ drawing }: { drawing: Drawing }) {
  const { resolvedTheme } = useTheme();
  const [title, setTitle] = useState(drawing.title);
  const [state, setState] = useState<SaveState>("idle");

  const latest = useRef<{ elements: El[]; bg: string; files: Record<string, unknown> } | null>(null);
  const dirtyScene = useRef(false);
  const dirtyTitle = useRef(false);
  const titleRef = useRef(title);
  const lastSig = useRef<string | null>(null); // chữ ký scene lần cuối để bỏ qua onChange không đổi nội dung
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const saving = useRef(false);

  /** Gom patch: chỉ gửi phần đã đổi. Loại phần tử đã xoá + file không còn được tham chiếu để payload gọn. */
  const buildPatch = useCallback(() => {
    const patch: Record<string, unknown> = {};
    if (dirtyTitle.current) patch.title = titleRef.current;
    if (dirtyScene.current && latest.current) {
      const els = latest.current.elements.filter((e) => !e.isDeleted);
      const used = new Set(els.map((e) => e.fileId).filter(Boolean) as string[]);
      const files = Object.fromEntries(Object.entries(latest.current.files).filter(([id]) => used.has(id)));
      patch.data = { elements: els, appState: { viewBackgroundColor: latest.current.bg }, files };
    }
    return patch;
  }, []);

  const flush = useCallback(async () => {
    if (saving.current) return;
    const patch = buildPatch();
    if (!Object.keys(patch).length) return;
    const hadScene = dirtyScene.current, hadTitle = dirtyTitle.current;
    dirtyScene.current = dirtyTitle.current = false;
    saving.current = true;
    setState("saving");
    try {
      await send(`/api/drawings/${drawing._id}`, "PATCH", patch);
      saving.current = false;
      if (dirtyScene.current || dirtyTitle.current) { setState("dirty"); void flush(); }
      else setState("saved");
      mutate("/api/drawings");
    } catch (e) {
      saving.current = false;
      dirtyScene.current ||= hadScene;
      dirtyTitle.current ||= hadTitle;
      setState(e instanceof Error && /quá lớn/i.test(e.message) ? "toolarge" : "error");
    }
  }, [buildPatch, drawing._id]);

  const schedule = useCallback(() => {
    setState((s) => (s === "dirty" ? s : "dirty"));
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, SAVE_MS);
  }, [flush]);

  // onChange của Excalidraw bắn rất dày (cả khi chọn / kéo canvas) -> so chữ ký trước khi lưu
  const onChange = useCallback((elements: readonly unknown[], appState: { viewBackgroundColor: string }, files: Record<string, unknown>) => {
    const els = elements as El[];
    const sig = `${els.length}:${els.reduce((a, e) => a + e.version + (e.isDeleted ? 1 : 0), 0)}:${appState.viewBackgroundColor}`;
    latest.current = { elements: els, bg: appState.viewBackgroundColor, files };
    if (lastSig.current === null) { lastSig.current = sig; return; } // lần gọi đầu = nạp dữ liệu, không phải chỉnh sửa
    if (sig === lastSig.current) return;
    lastSig.current = sig;
    dirtyScene.current = true;
    schedule();
  }, [schedule]);

  // Lưu nốt khi đóng tab / rời trang; thử lại khi có mạng
  useEffect(() => {
    const send_ = () => {
      const patch = buildPatch();
      if (!Object.keys(patch).length) return;
      const body = JSON.stringify(patch);
      // keepalive bị giới hạn ~64KB; scene lớn thì gửi thường
      fetch(`/api/drawings/${drawing._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body, keepalive: body.length < 60_000 });
    };
    const onUnload = (e: BeforeUnloadEvent) => {
      if (dirtyScene.current || dirtyTitle.current) { send_(); e.preventDefault(); }
    };
    const onOnline = () => void flush();
    window.addEventListener("beforeunload", onUnload);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      window.removeEventListener("online", onOnline);
      clearTimeout(timer.current);
      if (dirtyScene.current || dirtyTitle.current) { send_(); mutate("/api/drawings"); }
    };
  }, [buildPatch, drawing._id, flush]);

  const initial = {
    elements: (drawing.data?.elements ?? []) as never[],
    appState: { viewBackgroundColor: (drawing.data?.appState?.viewBackgroundColor as string) ?? undefined },
    files: (drawing.data?.files ?? {}) as never,
    scrollToContent: true,
  };

  return (
    <div className="flex h-[calc(100dvh-3rem)] flex-col">
      <div className="flex items-center gap-2 border-b px-3 py-1.5">
        <Button asChild variant="ghost" size="icon" aria-label="Về danh sách"><Link href="/draw"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <input
          value={title}
          onChange={(e) => { setTitle(e.target.value); titleRef.current = e.target.value; dirtyTitle.current = true; schedule(); }}
          placeholder="Bản vẽ không tên"
          className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
        />
        <Status state={state} onRetry={flush} />
      </div>
      <div className="min-h-0 flex-1">
        <Excalidraw
          initialData={initial}
          theme={resolvedTheme === "dark" ? "dark" : "light"}
          langCode="vi-VN"
          onChange={onChange as never}
        />
      </div>
    </div>
  );
}

function Status({ state, onRetry }: { state: SaveState; onRetry: () => void }) {
  const base = "inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground";
  if (state === "dirty") return <span className={base}>Chưa lưu</span>;
  if (state === "saving") return <span className={base}><Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang lưu…</span>;
  if (state === "saved") return <span className={base}><Check className="h-3.5 w-3.5 text-emerald-500" /> Saved</span>;
  if (state === "toolarge") return <span className="inline-flex shrink-0 items-center gap-1 text-xs text-danger"><TriangleAlert className="h-3.5 w-3.5" /> Bản vẽ quá lớn (&gt;4MB), hãy bỏ bớt ảnh</span>;
  if (state === "error") return <button onClick={onRetry} className="inline-flex shrink-0 items-center gap-1 text-xs text-danger"><TriangleAlert className="h-3.5 w-3.5" /> Lỗi lưu · thử lại</button>;
  return null;
}

"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import { ArrowLeft, Check, Loader2, Pin, PinOff, Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { StatusPicker } from "@/components/status";
import { TagInput } from "@/components/tag-input";
import { EmptyState } from "@/components/empty-state";
import { useTopics } from "@/lib/hooks";
import { fetcher, send } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import { blocksToText } from "@/lib/blocks";
import type { NoteDTO, NoteStatus } from "@/types";

// BlockNote chỉ chạy ở client
const BlockEditor = dynamic(() => import("@/components/block-editor"), {
  ssr: false,
  loading: () => <div className="h-40 animate-pulse rounded-lg bg-muted" />,
});

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";
const AUTOSAVE_MS = 1000;

/** Thêm contentText (dùng cho search) ngay trước khi gửi, không tính trong lúc gõ. */
const withText = (patch: Record<string, unknown>) =>
  "content" in patch ? { ...patch, contentText: blocksToText(patch.content) } : patch;

export function NoteEditor({ noteId }: { noteId: string }) {
  // revalidate tắt để dữ liệu từ server không ghi đè thứ đang gõ
  const { data: note, error, isLoading } = useSWR<NoteDTO>(`/api/notes/${noteId}`, fetcher, {
    revalidateOnFocus: false, revalidateOnReconnect: false,
  });
  if (isLoading) return <div className="mx-auto max-w-3xl px-4 py-10"><div className="h-10 w-2/3 animate-pulse rounded bg-muted" /></div>;
  if (error || !note) {
    return <div className="p-8"><EmptyState emoji="🤷" title="Không tìm thấy ghi chú"><Button asChild><Link href="/">Về Dashboard</Link></Button></EmptyState></div>;
  }
  // key theo id: đổi note thì mount lại toàn bộ state
  return <Editor key={note._id} note={note} />;
}

function Editor({ note }: { note: NoteDTO }) {
  const router = useRouter();
  const { data: topics = [] } = useTopics();
  const topic = topics.find((t) => t._id === note.topicId);

  const [title, setTitle] = useState(note.title);
  const [tags, setTags] = useState(note.tags);
  const [status, setStatus] = useState<NoteStatus>(note.status);
  const [pinned, setPinned] = useState(note.pinned);
  const [topicId, setTopicId] = useState(note.topicId);
  const [question, setQuestion] = useState(note.question ?? "");
  const [answer, setAnswer] = useState(note.answer ?? "");
  const [saveState, setSaveState] = useState<SaveState>("idle");

  // ---- Autosave: gom thay đổi vào `pending`, lưu sau 1s ngừng gõ ----
  const pending = useRef<Record<string, unknown>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const saving = useRef(false);

  const flush = useCallback(async () => {
    if (saving.current || !Object.keys(pending.current).length) return;
    const patch = pending.current;
    pending.current = {};
    saving.current = true;
    setSaveState("saving");
    try {
      await send(`/api/notes/${note._id}`, "PATCH", withText(patch));
      saving.current = false;
      if (Object.keys(pending.current).length) { setSaveState("dirty"); void flush(); }
      else setSaveState("saved");
      // Chỉ refetch khi dữ liệu hiển thị ở nơi khác thật sự đổi
      if ("topicId" in patch) mutate("/api/topics");
      if ("status" in patch || "topicId" in patch) mutate("/api/stats");
    } catch {
      saving.current = false;
      pending.current = { ...patch, ...pending.current }; // giữ lại để thử lần sau
      setSaveState("error");
    }
  }, [note._id]);

  const queue = useCallback((patch: Record<string, unknown>) => {
    Object.assign(pending.current, patch);
    setSaveState("dirty");
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, AUTOSAVE_MS);
  }, [flush]);

  // Lưu nốt khi rời trang / đóng tab
  useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => {
      if (Object.keys(pending.current).length) {
        fetch(`/api/notes/${note._id}`, {
          method: "PATCH", keepalive: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(withText(pending.current)),
        });
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      clearTimeout(timer.current);
      if (Object.keys(pending.current).length) {
        void send(`/api/notes/${note._id}`, "PATCH", withText(pending.current)).then(() =>
          // revalidate mọi list note (key có query) để card/preview ở trang topic luôn mới
          mutate((k) => typeof k === "string" && (k.startsWith("/api/notes?") || k === "/api/stats"))
        );
      }
    };
  }, [note._id]);

  async function remove() {
    if (!confirm("Xoá ghi chú này?")) return;
    pending.current = {};
    clearTimeout(timer.current);
    await send(`/api/notes/${note._id}`, "DELETE");
    mutate("/api/topics");
    mutate("/api/stats");
    router.push(`/topics/${note.topicId}`);
  }

  const isQA = note.type === "qa";

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 sm:px-8 sm:py-8">
      {/* Thanh trên */}
      <div className="mb-6 flex items-center justify-between gap-2">
        <Link href={`/topics/${topicId}`} className="inline-flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 shrink-0" />
          <span className="truncate">{topic ? `${topic.icon} ${topic.name}` : "Quay lại"}</span>
        </Link>
        <div className="flex items-center gap-1">
          <SaveIndicator state={saveState} onRetry={flush} />
          <Button variant="ghost" size="icon" aria-label={pinned ? "Bỏ ghim" : "Ghim"}
            onClick={() => { setPinned(!pinned); queue({ pinned: !pinned }); }}>
            {pinned ? <Pin className="h-4 w-4 fill-current text-amber-500" /> : <PinOff className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" aria-label="Xoá ghi chú" onClick={remove}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Tiêu đề */}
      <input
        value={title}
        onChange={(e) => { setTitle(e.target.value); queue({ title: e.target.value }); }}
        placeholder={isQA ? "Tiêu đề ngắn (tuỳ chọn)" : "Tiêu đề"}
        className="mb-4 w-full bg-transparent text-3xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/50 sm:text-4xl"
        autoFocus={!note.title && !isQA}
      />

      {/* Thuộc tính */}
      <div className="mb-6 space-y-3 border-b pb-5">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <StatusPicker value={status} onChange={(s) => { setStatus(s); queue({ status: s }); }} />
          <select
            value={topicId}
            onChange={(e) => { setTopicId(e.target.value); queue({ topicId: e.target.value }); }}
            className="h-8 rounded-md border bg-background px-2 text-xs"
            aria-label="Chủ đề"
          >
            {topics.map((t) => <option key={t._id} value={t._id}>{t.icon} {t.name}</option>)}
          </select>
        </div>
        <TagInput tags={tags} onChange={(t) => { setTags(t); queue({ tags: t }); }} />
      </div>

      {/* Q&A: câu hỏi + câu trả lời */}
      {isQA && (
        <div className="mb-8 space-y-4">
          <Field label="Câu hỏi">
            <Textarea value={question} rows={2} placeholder="Nhà tuyển dụng sẽ hỏi gì?"
              onChange={(e) => { setQuestion(e.target.value); queue({ question: e.target.value }); }} className="text-base font-medium" />
          </Field>
          <Field label="Câu trả lời">
            <Textarea value={answer} rows={6} placeholder="Câu trả lời mẫu của bạn…"
              onChange={(e) => { setAnswer(e.target.value); queue({ answer: e.target.value }); }} className="text-base" />
          </Field>
          <p className="pt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Ghi chú thêm</p>
        </div>
      )}

      {/* Editor block */}
      <BlockEditor
        initialContent={note.content as unknown[] | undefined}
        onChange={(content) => queue({ content })}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</label>{children}</div>;
}

function SaveIndicator({ state, onRetry }: { state: SaveState; onRetry: () => void }) {
  const base = "mr-1 inline-flex items-center gap-1 text-xs text-muted-foreground";
  if (state === "saving" || state === "dirty") return <span className={base}><Loader2 className={cn("h-3.5 w-3.5", state === "saving" && "animate-spin")} /> Đang lưu…</span>;
  if (state === "saved") return <span className={base}><Check className="h-3.5 w-3.5 text-emerald-500" /> Saved</span>;
  if (state === "error") return <button onClick={onRetry} className="mr-1 inline-flex items-center gap-1 text-xs text-danger"><TriangleAlert className="h-3.5 w-3.5" /> Lỗi lưu · thử lại</button>;
  return null;
}

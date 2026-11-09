"use client";
import { memo, useCallback, useEffect, useRef, useState } from "react";
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
import { FormatMenu, type FormatMode } from "@/components/format-menu";
import { MarkdownMenu } from "@/components/markdown-menu";
import { useConfirm } from "@/components/confirm";
import { useTopics } from "@/lib/hooks";
import { fetcher, send } from "@/lib/fetcher";
import { blocksToText } from "@/lib/blocks";
import { cleanText, formatEditor, type FormatTarget } from "@/lib/format";
import { importMarkdown, exportMarkdown, downloadText, MAX_MD_BYTES, type MarkdownTarget } from "@/lib/markdown";
import { cn } from "@/lib/utils";
import type { NoteDTO, NoteStatus } from "@/types";

// BlockNote chỉ chạy ở client; memo để các ô khác re-render không kéo editor theo
const BlockEditor = dynamic(() => import("@/components/block-editor"), {
  ssr: false,
  loading: () => <div className="h-40 animate-pulse rounded-lg bg-muted" />,
});

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";
const AUTOSAVE_MS = 1000;

export function NoteEditor({ noteId }: { noteId: string }) {
  // revalidate tắt để dữ liệu từ server không ghi đè thứ đang gõ
  const { data: note, error, isLoading } = useSWR<NoteDTO>(`/api/notes/${noteId}`, fetcher, {
    revalidateOnFocus: false, revalidateOnReconnect: false,
  });
  if (isLoading) return <div className="mx-auto max-w-3xl px-4 py-10"><div className="h-10 w-2/3 animate-pulse rounded bg-muted" /></div>;
  if (error || !note) {
    return <div className="p-8"><EmptyState emoji="🤷" title="Không tìm thấy ghi chú"><Button asChild><Link href="/">Về Dashboard</Link></Button></EmptyState></div>;
  }
  return <Editor key={note._id} note={note} />; // key theo id: đổi note thì mount lại
}

const Field = memo(function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</label>{children}</div>;
});

function Editor({ note }: { note: NoteDTO }) {
  const router = useRouter();
  const confirm = useConfirm();
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
  const [formatting, setFormatting] = useState(false);
  const [toast, setToast] = useState<{ text: string; warn?: boolean } | null>(null);

  const editorRef = useRef<FormatTarget | null>(null);
  const onReady = useCallback((e: FormatTarget) => { editorRef.current = e; }, []);

  // ---- Autosave ----
  // Field thường gom vào `pending`; nội dung editor chỉ đánh dấu `contentDirty`
  // và được đọc (clone + tính text) 1 lần lúc lưu -> gõ không bị nặng dù note dài.
  const pending = useRef<Record<string, unknown>>({});
  const contentDirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const saving = useRef(false);

  const hasPending = () => contentDirty.current || Object.keys(pending.current).length > 0;

  const takePatch = useCallback(() => {
    const patch: Record<string, unknown> = { ...pending.current };
    pending.current = {};
    if (contentDirty.current && editorRef.current) {
      try {
        const doc = editorRef.current.document;
        patch.content = doc;
        patch.contentText = blocksToText(doc);
        contentDirty.current = false;
      } catch { /* editor đã huỷ: bỏ qua */ }
    }
    return patch;
  }, []);

  const flush = useCallback(async () => {
    if (saving.current || !hasPending()) return;
    const patch = takePatch();
    if (!Object.keys(patch).length) return;
    saving.current = true;
    setSaveState("saving");
    try {
      await send(`/api/notes/${note._id}`, "PATCH", patch);
      saving.current = false;
      if (hasPending()) { setSaveState("dirty"); void flush(); }
      else setSaveState("saved");
      // Chỉ refetch khi dữ liệu hiển thị ở nơi khác thật sự đổi
      if ("topicId" in patch) mutate("/api/topics");
      if ("status" in patch || "topicId" in patch) mutate("/api/stats");
    } catch {
      saving.current = false;
      const { content, contentText, ...rest } = patch;
      if (content !== undefined) contentDirty.current = true; // đọc lại bản mới nhất lần sau
      pending.current = { ...rest, ...pending.current };
      setSaveState("error");
    }
  }, [note._id, takePatch]);

  const schedule = useCallback(() => {
    setSaveState((s) => (s === "dirty" ? s : "dirty"));
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, AUTOSAVE_MS);
  }, [flush]);

  const queue = useCallback((patch: Record<string, unknown>) => {
    Object.assign(pending.current, patch);
    schedule();
  }, [schedule]);

  const onContentChange = useCallback(() => { contentDirty.current = true; schedule(); }, [schedule]);

  // Lưu nốt khi rời trang / đóng tab
  useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => {
      if (!hasPending()) return;
      fetch(`/api/notes/${note._id}`, {
        method: "PATCH", keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(takePatch()),
      });
      e.preventDefault();
    };
    const onOnline = () => void flush(); // mất mạng rồi có lại -> tự lưu bù
    window.addEventListener("beforeunload", onUnload);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      window.removeEventListener("online", onOnline);
      clearTimeout(timer.current);
      if (hasPending()) {
        void send(`/api/notes/${note._id}`, "PATCH", takePatch()).then(() =>
          mutate((k) => typeof k === "string" && (k.startsWith("/api/notes?") || k === "/api/stats"))
        );
      }
    };
  }, [note._id, takePatch, flush]);

  // ---- Format ----
  const showToast = useCallback((text: string, warn = false) => {
    setToast({ text, warn });
    setTimeout(() => setToast((t) => (t?.text === text ? null : t)), 3500);
  }, []);

  const runFormat = useCallback(async (mode: FormatMode) => {
    const ed = editorRef.current;
    if (!ed || formatting) return;
    setFormatting(true);
    try {
      const r = await formatEditor(ed, mode);
      // Q&A: làm đẹp luôn câu hỏi / câu trả lời
      let qa = 0;
      if (note.type === "qa" && mode !== "code") {
        const tidy = (s: string) => s.split("\n").map((l) => cleanText(l).trimEnd()).join("\n").replace(/\n{3,}/g, "\n\n").trim();
        const q = tidy(question), a = tidy(answer);
        if (q !== question) { setQuestion(q); queue({ question: q }); qa++; }
        if (a !== answer) { setAnswer(a); queue({ answer: a }); qa++; }
      }
      const parts = [r.code && `${r.code} code block`, r.text && `${r.text} đoạn văn`, r.empty && `${r.empty} dòng trống`, qa && "câu hỏi/đáp án"].filter(Boolean);
      if (r.failed.length) showToast(`Lỗi cú pháp ở ${r.failed.length} code block (${[...new Set(r.failed)].join(", ")}) — đã bỏ qua`, true);
      else if (parts.length) showToast(`✨ Đã format: ${parts.join(", ")}`);
      else showToast(r.skipped ? `Không có gì để format (${r.skipped} code block chưa chọn ngôn ngữ hỗ trợ)` : "Đã gọn gàng sẵn rồi ✓");
    } catch {
      showToast("Format thất bại", true);
    } finally {
      setFormatting(false);
    }
  }, [formatting, note.type, question, answer, queue, showToast]);

  // ---- Markdown ----
  const onImportMd = useCallback(async (file: File) => {
    const ed = editorRef.current as unknown as MarkdownTarget | null;
    if (!ed) return;
    if (file.size > MAX_MD_BYTES) return showToast("File quá lớn (tối đa 2MB)", true);
    try {
      const r = await importMarkdown(ed, await file.text(), { takeTitle: !title.trim() });
      if (r.title) { setTitle(r.title); queue({ title: r.title }); }
      if (!r.count && !r.title) return showToast("File Markdown trống", true);
      onContentChange();
      showToast(`📄 Đã nhập ${file.name}`);
    } catch {
      showToast("Không đọc được file Markdown", true);
    }
  }, [title, queue, onContentChange, showToast]);

  const onExportMd = useCallback(async () => {
    const ed = editorRef.current as unknown as MarkdownTarget | null;
    if (!ed) return;
    try {
      const name = (title.trim() || "note").replace(/[\\/:*?"<>|]+/g, "-").slice(0, 80);
      downloadText(`${name}.md`, await exportMarkdown(ed, title));
    } catch {
      showToast("Xuất Markdown thất bại", true);
    }
  }, [title, showToast]);

  // Phím tắt Shift+Alt+F (giống VS Code)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.shiftKey && e.altKey && e.code === "KeyF") { e.preventDefault(); void runFormat("all"); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [runFormat]);

  async function remove() {
    const ok = await confirm({ title: "Xoá ghi chú này?", description: "Không thể hoàn tác.", confirmText: "Xoá", danger: true });
    if (!ok) return;
    pending.current = {}; contentDirty.current = false;
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
          <MarkdownMenu onImport={onImportMd} onExport={onExportMd} />
          <FormatMenu onFormat={runFormat} busy={formatting} />
          <Button variant="ghost" size="icon" aria-label={pinned ? "Bỏ ghim" : "Ghim"}
            onClick={() => { setPinned(!pinned); queue({ pinned: !pinned }); }}>
            {pinned ? <Pin className="h-4 w-4 fill-current text-amber-500" /> : <PinOff className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" aria-label="Xoá ghi chú" onClick={remove}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Tiêu đề: Enter nhảy xuống nội dung như Notion */}
      <input
        value={title}
        onChange={(e) => { setTitle(e.target.value); queue({ title: e.target.value }); }}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); editorRef.current?.focus(); } }}
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

      {/* Q&A */}
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

      <BlockEditor initialContent={note.content as unknown[] | undefined} onChange={onContentChange} onReady={onReady} />

      {/* Toast kết quả format */}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
        {toast && (
          <div className={cn("page-enter pointer-events-auto max-w-md rounded-lg border bg-card px-4 py-2.5 text-sm shadow-lg", toast.warn && "border-amber-500/50")}>
            {toast.text}
          </div>
        )}
      </div>
    </div>
  );
}

function SaveIndicator({ state, onRetry }: { state: SaveState; onRetry: () => void }) {
  const base = "mr-1 inline-flex items-center gap-1 text-xs text-muted-foreground";
  // "dirty" không nhấp nháy spinner khi đang gõ (đỡ rối mắt) — chỉ hiện khi thật sự đang gửi
  if (state === "dirty") return <span className={base}>Chưa lưu</span>;
  if (state === "saving") return <span className={base}><Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang lưu…</span>;
  if (state === "saved") return <span className={base}><Check className="h-3.5 w-3.5 text-emerald-500" /> Saved</span>;
  if (state === "error") return <button onClick={onRetry} className="mr-1 inline-flex items-center gap-1 text-xs text-danger"><TriangleAlert className="h-3.5 w-3.5" /> Lỗi lưu · thử lại</button>;
  return null;
}

"use client";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { mutate } from "swr";
import { Layers, LayoutGrid, List, Plus, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NoteCard } from "@/components/note-card";
import { EmptyState } from "@/components/empty-state";
import { useNotes, useTopics } from "@/lib/hooks";
import { send } from "@/lib/fetcher";
import { useConfirm } from "@/components/confirm";
import { cn, STATUS_META } from "@/lib/utils";
import type { NoteDTO, NoteStatus, NoteType } from "@/types";

export function TopicView({ topicId }: { topicId: string }) {
  const router = useRouter();
  const confirm = useConfirm();
  const { data: topics, isLoading: loadingTopics } = useTopics();
  const topic = topics?.find((t) => t._id === topicId);
  const { data: notes = [], isLoading, mutate: mutateNotes } = useNotes({ topicId });

  const [status, setStatus] = useState<NoteStatus | "all">("all");
  const [tag, setTag] = useState<string | null>(null);
  const [view, setView] = useState<"card" | "list">("card");
  const [creating, setCreating] = useState(false);

  const allTags = useMemo(() => Array.from(new Set(notes.flatMap((n) => n.tags))).sort(), [notes]);
  const filtered = useMemo(
    () => notes.filter((n) => (status === "all" || n.status === status) && (!tag || n.tags.includes(tag))),
    [notes, status, tag]
  );
  const qaCount = notes.filter((n) => n.type === "qa").length;

  async function create(type: NoteType) {
    setCreating(true);
    try {
      const note = await send<NoteDTO>("/api/notes", "POST", { topicId, type, title: "" });
      mutate("/api/topics");
      router.push(`/notes/${note._id}`);
    } finally {
      setCreating(false);
    }
  }

  const togglePin = useCallback(async (n: NoteDTO) => {
    // optimistic: đảo pinned ngay, server xác nhận sau
    await mutateNotes(
      async () => {
        await send(`/api/notes/${n._id}`, "PATCH", { pinned: !n.pinned });
        return undefined;
      },
      { optimisticData: (cur) => (cur ?? []).map((x) => (x._id === n._id ? { ...x, pinned: !x.pinned } : x)), populateCache: false, revalidate: true }
    );
  }, [mutateNotes]);

  const remove = useCallback(async (n: NoteDTO) => {
    const ok = await confirm({ title: `Xoá ghi chú "${n.title || n.question || "Chưa đặt tên"}"?`, description: "Không thể hoàn tác.", confirmText: "Xoá", danger: true });
    if (!ok) return;
    // optimistic: card biến mất ngay, không chờ server
    await mutateNotes(
      async () => { await send(`/api/notes/${n._id}`, "DELETE"); return undefined; },
      { optimisticData: (cur) => (cur ?? []).filter((x) => x._id !== n._id), populateCache: false, revalidate: false }
    );
    mutate("/api/topics");
    mutate("/api/stats");
  }, [mutateNotes, confirm]);

  if (!loadingTopics && !topic) {
    return <div className="p-8"><EmptyState emoji="🤷" title="Không tìm thấy chủ đề" description="Chủ đề này có thể đã bị xoá."><Button asChild><Link href="/">Về Dashboard</Link></Button></EmptyState></div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl" style={{ background: (topic?.color ?? "#999") + "26" }}>
            {topic?.icon}
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{topic?.name ?? "…"}</h1>
            <p className="text-sm text-muted-foreground">{notes.length} ghi chú</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {qaCount > 0 && (
            <Button asChild variant="outline"><Link href={`/review?topicId=${topicId}`}><Layers className="h-4 w-4" /> Ôn tập</Link></Button>
          )}
          <Button variant="outline" disabled={creating} onClick={() => create("qa")}><HelpCircle className="h-4 w-4" /> Hỏi đáp</Button>
          <Button disabled={creating} onClick={() => create("knowledge")}><Plus className="h-4 w-4" /> Ghi chú</Button>
        </div>
      </div>

      {/* Bộ lọc */}
      {notes.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <Chip active={status === "all"} onClick={() => setStatus("all")}>Tất cả</Chip>
          {(Object.keys(STATUS_META) as NoteStatus[]).map((s) => (
            <Chip key={s} active={status === s} onClick={() => setStatus(s)}>{STATUS_META[s].label}</Chip>
          ))}
          <div className="ml-auto flex rounded-md border p-0.5">
            <Button variant={view === "card" ? "ghost" : "ghost"} size="icon" className={cn("h-7 w-7", view === "card" && "bg-accent")} onClick={() => setView("card")} aria-label="Dạng card"><LayoutGrid className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className={cn("h-7 w-7", view === "list" && "bg-accent")} onClick={() => setView("list")} aria-label="Dạng list"><List className="h-4 w-4" /></Button>
          </div>
          {allTags.length > 0 && (
            <div className="flex w-full flex-wrap gap-1.5 pt-1">
              {allTags.map((t) => (
                <button key={t} onClick={() => setTag(tag === t ? null : t)}
                  className={cn("rounded px-1.5 py-0.5 text-xs", tag === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent")}>
                  #{t}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Danh sách */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((i) => <div key={i} className="h-36 animate-pulse rounded-lg bg-muted" />)}</div>
      ) : notes.length === 0 ? (
        <EmptyState emoji="✍️" title="Chưa có ghi chú nào" description="Bắt đầu bằng một ghi chú kiến thức hoặc một câu hỏi phỏng vấn.">
          <Button onClick={() => create("knowledge")}><Plus className="h-4 w-4" /> Ghi chú kiến thức</Button>
          <Button variant="outline" onClick={() => create("qa")}><HelpCircle className="h-4 w-4" /> Câu hỏi Q&A</Button>
        </EmptyState>
      ) : filtered.length === 0 ? (
        <EmptyState emoji="🔎" title="Không có ghi chú khớp bộ lọc" />
      ) : (
        <div className={view === "card" ? "stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-3" : "stagger space-y-2"}>
          {filtered.map((n) => <NoteCard key={n._id} note={n} variant={view} onPin={togglePin} onDelete={remove} />)}
        </div>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn("rounded-full border px-3 py-1 text-xs font-medium", active ? "border-transparent bg-foreground text-background" : "text-muted-foreground hover:bg-accent")}>
      {children}
    </button>
  );
}

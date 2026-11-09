"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { mutate } from "swr";
import { Check, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status";
import { useNotes, useTopics } from "@/lib/hooks";
import { send } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import type { NoteDTO } from "@/types";

const shuffle = <T,>(arr: T[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** Chế độ ôn tập: ẩn câu trả lời, bấm để lật, đánh dấu Nhớ / Chưa nhớ. */
export function ReviewSession() {
  const topicId = useSearchParams().get("topicId") ?? undefined;
  const { data: topics = [] } = useTopics();
  const topic = topics.find((t) => t._id === topicId);
  const { data: notes, isLoading } = useNotes({ type: "qa", topicId });

  const [includeMastered, setIncludeMastered] = useState(false);
  const [deck, setDeck] = useState<NoteDTO[]>([]);
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [stats, setStats] = useState({ known: 0, unknown: 0 });
  const [round, setRound] = useState(0); // đổi round -> xáo lại bộ bài
  const [failed, setFailed] = useState(0); // số câu chưa lưu được status (mất mạng)
  const busy = useRef(false); // chống bấm đúp / giữ phím

  // Xây bộ bài (một lần khi dữ liệu về / khi đổi bộ lọc / bấm ôn lại)
  const ready = !!notes;
  useEffect(() => {
    if (!notes) return;
    setDeck(shuffle(notes.filter((n) => includeMastered || n.status !== "mastered")));
    setPos(0); setFlipped(false); setStats({ known: 0, unknown: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, includeMastered, round]);

  const card = deck[pos];
  const done = ready && pos >= deck.length;

  const answer = useCallback(async (known: boolean) => {
    if (!card || busy.current) return;
    busy.current = true;
    setStats((s) => ({ known: s.known + (known ? 1 : 0), unknown: s.unknown + (known ? 0 : 1) }));
    setPos((p) => p + 1);
    setFlipped(false);
    // Nhớ -> mastered; Chưa nhớ -> learning
    try {
      await send(`/api/notes/${card._id}`, "PATCH", { status: known ? "mastered" : "learning" });
      mutate("/api/stats");
    } catch {
      setFailed((n) => n + 1); // vẫn cho ôn tiếp, chỉ báo là chưa lưu
    } finally {
      busy.current = false;
    }
  }, [card]);

  // Phím tắt: Space lật, ← chưa nhớ, → nhớ
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input,textarea")) return;
      if (e.code === "Space") { e.preventDefault(); setFlipped((f) => !f); }
      if (flipped && e.key === "ArrowLeft") answer(false);
      if (flipped && e.key === "ArrowRight") answer(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipped, answer]);

  const progress = useMemo(() => (deck.length ? (pos / deck.length) * 100 : 0), [pos, deck.length]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ôn tập</h1>
          <p className="text-sm text-muted-foreground">{topic ? `${topic.icon} ${topic.name}` : "Tất cả chủ đề"}</p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={includeMastered} onChange={(e) => setIncludeMastered(e.target.checked)} />
          Gồm cả câu đã thuộc
        </label>
      </div>

      {isLoading || !ready ? (
        <div className="h-72 animate-pulse rounded-2xl bg-muted" />
      ) : deck.length === 0 ? (
        <EmptyState emoji="🎉" title="Không có câu hỏi nào cần ôn"
          description="Tạo ghi chú dạng Hỏi đáp (Q&A) hoặc bật “Gồm cả câu đã thuộc” để ôn lại.">
          <Button asChild><Link href="/">Về Dashboard</Link></Button>
        </EmptyState>
      ) : done ? (
        <div className="rounded-2xl border bg-card p-8 text-center">
          <div className="text-5xl">🏁</div>
          <h2 className="mt-3 text-xl font-semibold">Hoàn thành!</h2>
          <p className="mt-1 text-muted-foreground">
            Nhớ <b className="text-emerald-600">{stats.known}</b> · Chưa nhớ <b className="text-amber-600">{stats.unknown}</b>
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Button onClick={() => setRound((r) => r + 1)}><RotateCcw className="h-4 w-4" /> Ôn lại</Button>
            <Button variant="outline" asChild><Link href="/">Dashboard</Link></Button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>{pos + 1} / {deck.length}</span>
            <StatusBadge status={card.status} />
          </div>
          {failed > 0 && <p className="mb-2 text-xs text-danger">⚠ {failed} câu chưa lưu được trạng thái (kiểm tra mạng).</p>}
          <div className="mb-5 h-1 overflow-hidden rounded bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>

          {/* Flashcard lật 3D */}
          <div className="[perspective:1200px]">
            <button
              onClick={() => setFlipped((f) => !f)}
              aria-label="Lật thẻ"
              className={cn("relative min-h-[18rem] w-full text-left transition-transform duration-500 [transform-style:preserve-3d]", flipped && "[transform:rotateY(180deg)]")}
            >
              <Face label="Câu hỏi" hint="Bấm hoặc nhấn Space để xem đáp án">
                <p className="text-xl font-medium leading-relaxed">{card.question || card.title}</p>
              </Face>
              <Face label="Đáp án" back>
                <p className="whitespace-pre-wrap text-base leading-relaxed">{card.answer || "Chưa có câu trả lời."}</p>
                <Link href={`/notes/${card._id}`} onClick={(e) => e.stopPropagation()} className="mt-4 inline-block text-xs text-muted-foreground underline">Mở ghi chú</Link>
              </Face>
            </button>
          </div>

          <div className={cn("mt-5 grid grid-cols-2 gap-3 transition-opacity", !flipped && "pointer-events-none opacity-30")}>
            <Button variant="outline" className="h-12 border-amber-500/40 text-amber-700 hover:bg-amber-500/10 dark:text-amber-300" onClick={() => answer(false)}>
              <X className="h-4 w-4" /> Chưa nhớ <kbd className="hidden text-[10px] opacity-60 sm:inline">←</kbd>
            </Button>
            <Button className="h-12 bg-emerald-600 text-white hover:bg-emerald-600/90" onClick={() => answer(true)}>
              <Check className="h-4 w-4" /> Nhớ <kbd className="hidden text-[10px] opacity-70 sm:inline">→</kbd>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function Face({ label, hint, back, children }: { label: string; hint?: string; back?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col overflow-y-auto rounded-2xl border bg-card p-6 shadow-sm [backface-visibility:hidden]",
        back && "[transform:rotateY(180deg)]"
      )}
    >
      <span className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="my-auto">{children}</div>
      {hint && <span className="mt-4 text-center text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

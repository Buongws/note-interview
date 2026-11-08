"use client";
import Link from "next/link";
import { Layers, NotebookText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NoteCard } from "@/components/note-card";
import { EmptyState } from "@/components/empty-state";
import { useStats, useTopics } from "@/lib/hooks";
import { STATUS_META } from "@/lib/utils";
import type { NoteStatus } from "@/types";

export function Dashboard() {
  const { data: stats, isLoading } = useStats();
  const { data: topics = [] } = useTopics();

  if (isLoading || !stats) {
    return <div className="mx-auto max-w-5xl space-y-4 px-4 py-8 sm:px-8">{[1, 2].map((i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />)}</div>;
  }

  const pct = stats.total ? Math.round((stats.status.mastered / stats.total) * 100) : 0;
  const toReview = stats.status.learning + stats.status.reviewing;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Tổng quan quá trình ôn phỏng vấn của bạn</p>
        </div>
        {stats.types.qa > 0 && (
          <Button asChild><Link href="/review"><Layers className="h-4 w-4" /> Ôn tập ngay ({toReview})</Link></Button>
        )}
      </div>

      {stats.total === 0 ? (
        <EmptyState emoji="👋" title="Chào mừng bạn!" description="Tạo chủ đề ở thanh bên trái (dấu +), rồi thêm ghi chú đầu tiên.">
          {topics[0] && <Button asChild><Link href={`/topics/${topics[0]._id}`}>Mở “{topics[0].name}”</Link></Button>}
        </EmptyState>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Tổng ghi chú" value={stats.total} />
            {(Object.keys(STATUS_META) as NoteStatus[]).map((s) => (
              <Stat key={s} label={STATUS_META[s].label} value={stats.status[s]} dot={STATUS_META[s].dot} />
            ))}
          </div>

          {/* Thanh tiến độ */}
          <div className="mt-5 rounded-xl border bg-card p-4">
            <div className="mb-2 flex justify-between text-sm"><span className="font-medium">Tiến độ thuộc bài</span><span className="text-muted-foreground">{pct}%</span></div>
            <div className="flex h-2 overflow-hidden rounded-full bg-muted">
              {(["mastered", "reviewing", "learning"] as NoteStatus[]).map((s) => (
                <div key={s} className={STATUS_META[s].dot} style={{ width: `${(stats.status[s] / stats.total) * 100}%` }} />
              ))}
            </div>
          </div>

          <h2 className="mb-3 mt-10 text-sm font-semibold">Sửa gần đây</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stats.recent.map((n) => <NoteCard key={n._id} note={n} />)}
          </div>
        </>
      )}

      {topics.length > 0 && (
        <>
          <h2 className="mb-3 mt-10 text-sm font-semibold">Chủ đề</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {topics.map((t) => (
              <Link key={t._id} href={`/topics/${t._id}`} className="flex items-center gap-3 rounded-lg border bg-card p-3 hover:shadow-md">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg text-lg" style={{ background: t.color + "26" }}>{t.icon}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{t.name}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground"><NotebookText className="h-3 w-3" /> {t.noteCount}</p>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, dot }: { label: string; value: number; dot?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">{dot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />}{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

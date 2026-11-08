"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, HelpCircle, Search } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useTopics } from "@/lib/hooks";
import { fetcher } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import type { NoteDTO } from "@/types";

/** Tìm kiếm toàn cục (Ctrl/Cmd + K) theo title, nội dung, tag. */
export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const { data: topics = [] } = useTopics();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<NoteDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const reqId = useRef(0);

  useEffect(() => {
    if (!open) { setQ(""); setResults([]); }
  }, [open]);

  // Debounce 250ms; bỏ qua response cũ (reqId) để tránh kết quả nhảy lung tung
  useEffect(() => {
    if (!q.trim()) { setResults([]); setLoading(false); return; }
    setLoading(true);
    const id = ++reqId.current;
    const t = setTimeout(async () => {
      try {
        const data = await fetcher<NoteDTO[]>(`/api/notes?q=${encodeURIComponent(q.trim())}&limit=20`);
        if (id === reqId.current) { setResults(data); setIndex(0); }
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const go = (n: NoteDTO) => { onOpenChange(false); router.push(`/notes/${n._id}`); };

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setIndex((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setIndex((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && results[index]) go(results[index]);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="max-w-xl p-0">
        <DialogTitle className="sr-only">Tìm kiếm</DialogTitle>
        <div className="flex items-center gap-2 border-b px-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Tìm theo tiêu đề, nội dung, tag…"
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-1.5">
          {!q.trim() && <p className="px-3 py-6 text-center text-sm text-muted-foreground">Gõ để tìm ghi chú của bạn</p>}
          {q.trim() && !loading && results.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">Không tìm thấy kết quả cho “{q}”</p>
          )}
          {results.map((n, i) => {
            const topic = topics.find((t) => t._id === n.topicId);
            const Icon = n.type === "qa" ? HelpCircle : FileText;
            return (
              <button
                key={n._id}
                onClick={() => go(n)}
                onMouseEnter={() => setIndex(i)}
                className={cn("flex w-full items-start gap-3 rounded-md px-3 py-2 text-left", i === index && "bg-accent")}
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{n.title || n.question || "Chưa đặt tên"}</p>
                  <p className="truncate text-xs text-muted-foreground">{n.preview || "Chưa có nội dung"}</p>
                </div>
                {topic && <span className="shrink-0 text-xs text-muted-foreground">{topic.icon} {topic.name}</span>}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

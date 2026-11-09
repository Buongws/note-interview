"use client";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { EMOJI_GROUPS, ALL_EMOJIS } from "@/lib/emojis";
import { normalizeSearch } from "@/lib/search";
import { cn } from "@/lib/utils";

/** Bảng chọn emoji: tab theo nhóm + tìm theo từ khoá (không phân biệt dấu). */
export function EmojiPicker({ value, onChange }: { value: string; onChange: (e: string) => void }) {
  const groups = Object.keys(EMOJI_GROUPS);
  const [group, setGroup] = useState(groups[0]);
  const [q, setQ] = useState("");

  const items = useMemo(() => {
    const s = normalizeSearch(q.trim());
    if (!s) return EMOJI_GROUPS[group];
    // bỏ trùng emoji xuất hiện ở nhiều nhóm
    const seen = new Set<string>();
    return ALL_EMOJIS.filter((i) => normalizeSearch(i.k).includes(s) && !seen.has(i.e) && seen.add(i.e));
  }, [q, group]);

  return (
    <div className="rounded-lg border bg-background">
      <div className="flex items-center gap-2 border-b px-2.5">
        <Search className="h-3.5 w-3.5 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm emoji… (vd: code, sách)"
          className="h-8 w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
        />
      </div>
      {!q && (
        <div className="flex gap-0.5 overflow-x-auto border-b px-1.5 py-1 [scrollbar-width:none]">
          {groups.map((g) => (
            <button
              key={g} type="button" onClick={() => setGroup(g)}
              className={cn("shrink-0 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent", g === group && "bg-accent font-medium text-foreground")}
            >
              {g}
            </button>
          ))}
        </div>
      )}
      <div className="grid max-h-44 grid-cols-8 gap-0.5 overflow-y-auto p-1.5">
        {items.map((i) => (
          <button
            key={i.e} type="button" title={i.k} onClick={() => onChange(i.e)}
            className={cn("flex h-8 w-full items-center justify-center rounded-md text-lg transition-transform hover:scale-110 hover:bg-accent", value === i.e && "bg-accent ring-1 ring-primary")}
          >
            {i.e}
          </button>
        ))}
        {items.length === 0 && <p className="col-span-8 py-4 text-center text-xs text-muted-foreground">Không có emoji khớp</p>}
      </div>
    </div>
  );
}

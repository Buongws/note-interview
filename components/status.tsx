"use client";
import { cn, STATUS_META } from "@/lib/utils";
import type { NoteStatus } from "@/types";

export function StatusBadge({ status, className }: { status: NoteStatus; className?: string }) {
  const m = STATUS_META[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", m.className, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} /> {m.label}
    </span>
  );
}

/** Chọn status dạng segmented control. */
export function StatusPicker({ value, onChange }: { value: NoteStatus; onChange: (s: NoteStatus) => void }) {
  return (
    <div className="inline-flex rounded-lg border bg-muted p-0.5">
      {(Object.keys(STATUS_META) as NoteStatus[]).map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors",
            value === s && "bg-background text-foreground shadow-sm"
          )}
        >
          {STATUS_META[s].label}
        </button>
      ))}
    </div>
  );
}

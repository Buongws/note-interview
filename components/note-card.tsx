"use client";
import { memo } from "react";
import Link from "next/link";
import { FileText, HelpCircle, MoreHorizontal, Pin, PinOff, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/status";
import { cn, timeAgo } from "@/lib/utils";
import type { NoteDTO } from "@/types";

interface Props {
  note: NoteDTO;
  variant?: "card" | "list";
  onPin?: (n: NoteDTO) => void;
  onDelete?: (n: NoteDTO) => void;
}

export const NoteCard = memo(function NoteCard({ note, variant = "card", onPin, onDelete }: Props) {
  const Icon = note.type === "qa" ? HelpCircle : FileText;
  const title = note.title || note.question || "Chưa đặt tên";
  const list = variant === "list";

  return (
    <div className={cn("group relative rounded-lg border bg-card transition-shadow hover:shadow-md", list ? "flex items-center gap-3 px-3 py-2.5" : "flex flex-col p-4")}>
      <Link href={`/notes/${note._id}`} className="absolute inset-0 z-0 rounded-lg" aria-label={title} />

      <div className={cn("pointer-events-none flex min-w-0 items-center gap-2", list ? "flex-1" : "mb-2")}>
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <h3 className="truncate text-sm font-medium">{title}</h3>
        {note.pinned && <Pin className="h-3.5 w-3.5 shrink-0 fill-current text-amber-500" />}
      </div>

      {!list && (
        <p className="pointer-events-none mb-3 line-clamp-3 min-h-[3.75rem] text-sm text-muted-foreground">
          {note.preview || "Chưa có nội dung"}
        </p>
      )}

      <div className={cn("pointer-events-none flex items-center gap-2", list ? "shrink-0" : "mt-auto flex-wrap")}>
        <StatusBadge status={note.status} />
        {note.tags.slice(0, list ? 2 : 3).map((t) => (
          <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">#{t}</span>
        ))}
        <span className={cn("text-xs text-muted-foreground", !list && "ml-auto")}>{timeAgo(note.updatedAt)}</span>
      </div>

      <div className={cn("z-10", list ? "ml-1" : "absolute right-2 top-2")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button aria-label="Tuỳ chọn" className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-accent md:opacity-0 md:group-hover:opacity-100 data-[state=open]:opacity-100">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => onPin?.(note)}>
              {note.pinned ? <><PinOff className="h-4 w-4" /> Bỏ ghim</> : <><Pin className="h-4 w-4" /> Ghim</>}
            </DropdownMenuItem>
            <DropdownMenuItem danger onSelect={() => onDelete?.(note)}><Trash2 className="h-4 w-4" /> Xoá</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
});

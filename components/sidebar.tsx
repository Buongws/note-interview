"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { mutate } from "swr";
import {
  DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { BookOpenText, GripVertical, LayoutDashboard, MoreHorizontal, PenTool, Pencil, Plus, Search, Trash2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TopicDialog } from "@/components/topic-dialog";
import { useTopics } from "@/lib/hooks";
import { send } from "@/lib/fetcher";
import { useConfirm } from "@/components/confirm";
import { cn } from "@/lib/utils";
import type { TopicDTO } from "@/types";

interface Props {
  username: string;
  onNavigate?: () => void; // đóng drawer trên mobile
  onSearch: () => void;
}

export function Sidebar({ username, onNavigate, onSearch }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const confirm = useConfirm();
  const { data: topics = [], isLoading } = useTopics();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TopicDTO | null>(null);

  // Mouse kéo ngay; cảm ứng cần giữ 250ms để không cản việc cuộn
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 6 } })
  );

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = topics.findIndex((t) => t._id === active.id);
    const to = topics.findIndex((t) => t._id === over.id);
    const next = arrayMove(topics, from, to);
    // optimistic update rồi lưu server
    await mutate("/api/topics", next, { revalidate: false });
    await send("/api/topics", "PUT", { ids: next.map((t) => t._id) });
    mutate("/api/topics");
  }

  async function removeTopic(t: TopicDTO) {
    const ok = await confirm({
      title: `Xoá chủ đề "${t.name}"?`,
      description: t.noteCount ? `${t.noteCount} ghi chú bên trong cũng sẽ bị xoá vĩnh viễn.` : undefined,
      confirmText: "Xoá",
      danger: true,
    });
    if (!ok) return;
    await send(`/api/topics/${t._id}`, "DELETE");
    await mutate("/api/topics");
    mutate("/api/stats");
    if (pathname === `/topics/${t._id}`) router.push("/");
  }

  const navItem = (href: string, label: string, Icon: typeof LayoutDashboard) => (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent",
        (href === "/" ? pathname === "/" : pathname.startsWith(href)) && "bg-accent font-medium"
      )}
    >
      <Icon className="h-4 w-4 text-muted-foreground" /> {label}
    </Link>
  );

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
          <BookOpenText className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight">Interview Note</p>
          <p className="truncate text-xs text-muted-foreground">@{username}</p>
        </div>
      </div>

      <div className="space-y-0.5 px-2">
        <button
          onClick={onSearch}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent"
        >
          <Search className="h-4 w-4" /> Tìm kiếm
          <kbd className="ml-auto rounded border bg-background px-1.5 text-[10px]">⌘K</kbd>
        </button>
        {navItem("/", "Dashboard", LayoutDashboard)}
        {navItem("/review", "Ôn tập", Layers)}
        {navItem("/draw", "Bảng vẽ", PenTool)}
      </div>

      <div className="mt-4 flex items-center justify-between px-4">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Chủ đề</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Thêm chủ đề"
          onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <nav className="mt-1 flex-1 space-y-0.5 overflow-y-auto px-2 pb-2">
        {isLoading && <div className="space-y-1.5 px-2 pt-1">{[1, 2, 3].map((i) => <div key={i} className="h-7 animate-pulse rounded-md bg-accent" />)}</div>}
        {!isLoading && topics.length === 0 && (
          <p className="px-2 py-3 text-xs text-muted-foreground">Chưa có chủ đề nào. Bấm + để tạo chủ đề đầu tiên.</p>
        )}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={topics.map((t) => t._id)} strategy={verticalListSortingStrategy}>
            {topics.map((t) => (
              <TopicItem
                key={t._id}
                topic={t}
                active={pathname === `/topics/${t._id}`}
                onNavigate={onNavigate}
                onEdit={() => { setEditing(t); setDialogOpen(true); }}
                onDelete={() => removeTopic(t)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </nav>

      <TopicDialog open={dialogOpen} onOpenChange={setDialogOpen} topic={editing} />
    </div>
  );
}

function TopicItem({
  topic, active, onNavigate, onEdit, onDelete,
}: { topic: TopicDTO; active: boolean; onNavigate?: () => void; onEdit: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: topic._id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("group flex items-center rounded-md hover:bg-accent", active && "bg-accent", isDragging && "z-10 opacity-70 shadow-md")}
    >
      <button {...attributes} {...listeners} aria-label="Kéo để sắp xếp"
        className="hidden h-7 w-5 cursor-grab touch-none items-center justify-center text-muted-foreground/60 group-hover:flex">
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <Link href={`/topics/${topic._id}`} onClick={onNavigate}
        className="flex min-w-0 flex-1 items-center gap-2 py-1.5 pl-2 pr-1 text-sm group-hover:pl-0">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-sm" style={{ background: topic.color + "2e" }}>
          {topic.icon}
        </span>
        <span className={cn("truncate", active && "font-medium")}>{topic.name}</span>
        <span className="ml-auto text-xs tabular-nums text-muted-foreground">{topic.noteCount}</span>
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button aria-label="Tuỳ chọn chủ đề" className="mr-1 flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-background md:opacity-0 md:group-hover:opacity-100 data-[state=open]:opacity-100">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={onEdit}><Pencil className="h-4 w-4" /> Sửa</DropdownMenuItem>
          <DropdownMenuItem danger onSelect={onDelete}><Trash2 className="h-4 w-4" /> Xoá</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

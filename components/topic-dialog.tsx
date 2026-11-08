"use client";
import { useEffect, useState } from "react";
import { mutate } from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { send } from "@/lib/fetcher";
import { useConfirm } from "@/components/confirm";
import { cn, TOPIC_COLORS, TOPIC_EMOJIS } from "@/lib/utils";
import type { TopicDTO } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topic?: TopicDTO | null; // có => chế độ sửa
}

/** Dialog thêm / sửa topic: tên + emoji + màu. */
export function TopicDialog({ open, onOpenChange, topic }: Props) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📁");
  const [color, setColor] = useState(TOPIC_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const confirm = useConfirm();

  // Form đã bị chỉnh so với giá trị ban đầu?
  const dirty =
    name.trim() !== (topic?.name ?? "") || icon !== (topic?.icon ?? "📁") || color !== (topic?.color ?? TOPIC_COLORS[0]);

  /** Mọi đường đóng (click ra ngoài, Esc, X, Huỷ) đều đi qua đây. */
  async function requestClose() {
    if (saving) return;
    if (dirty && !(await confirm({
      title: "Bỏ thay đổi?",
      description: "Bạn đang nhập dở. Đóng bây giờ sẽ mất những gì vừa nhập.",
      confirmText: "Bỏ thay đổi",
      cancelText: "Tiếp tục nhập",
      danger: true,
    }))) return;
    onOpenChange(false);
  }

  // Reset form mỗi lần mở
  useEffect(() => {
    if (!open) return;
    setName(topic?.name ?? "");
    setIcon(topic?.icon ?? "📁");
    setColor(topic?.color ?? TOPIC_COLORS[0]);
    setError("");
  }, [open, topic]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      if (topic) await send(`/api/topics/${topic._id}`, "PATCH", { name, icon, color });
      else await send("/api/topics", "POST", { name, icon, color });
      await mutate("/api/topics");
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : void requestClose())}>
      <DialogContent>
        <DialogTitle className="mb-4 text-base font-semibold">{topic ? "Sửa chủ đề" : "Chủ đề mới"}</DialogTitle>
        <form onSubmit={submit} className="space-y-4">
          <div className="flex items-center gap-2">
            <div
              className="flex h-9 w-12 shrink-0 items-center justify-center rounded-md text-lg"
              style={{ background: color + "26" }}
            >
              {icon}
            </div>
            <Input autoFocus placeholder="Tên chủ đề" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Emoji</p>
            <div className="flex flex-wrap gap-1">
              {TOPIC_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setIcon(e)}
                  className={cn("h-8 w-8 rounded-md text-base hover:bg-accent", icon === e && "bg-accent ring-1 ring-primary")}
                >
                  {e}
                </button>
              ))}
            </div>
            <Input
              className="mt-2 w-24"
              placeholder="hoặc gõ"
              value=""
              onChange={(e) => {
                // lấy ký tự đầu tiên (grapheme) người dùng gõ/dán
                const first = Array.from(new Intl.Segmenter().segment(e.target.value))[0]?.segment;
                if (first) setIcon(first);
              }}
            />
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Màu</p>
            <div className="flex flex-wrap gap-2">
              {TOPIC_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={c}
                  onClick={() => setColor(c)}
                  className={cn("h-6 w-6 rounded-full ring-offset-2 ring-offset-card", color === c && "ring-2 ring-foreground/60")}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => void requestClose()}>Huỷ</Button>
            <Button type="submit" disabled={saving || !name.trim()}>{topic ? "Lưu" : "Tạo"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

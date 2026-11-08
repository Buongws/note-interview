import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { NoteStatus } from "@/types";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const STATUS_META: Record<NoteStatus, { label: string; className: string; dot: string }> = {
  learning: { label: "Đang học", className: "bg-amber-500/15 text-amber-700 dark:text-amber-300", dot: "bg-amber-500" },
  reviewing: { label: "Cần ôn", className: "bg-sky-500/15 text-sky-700 dark:text-sky-300", dot: "bg-sky-500" },
  mastered: { label: "Đã thuộc", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
};

export const TOPIC_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f97316",
  "#eab308", "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6", "#64748b",
];

export const TOPIC_EMOJIS = [
  "📁", "💻", "🤖", "🏗️", "🧠", "🟨", "⚛️", "🗄️", "🌐", "🔐",
  "⚡", "📚", "🧪", "🎯", "🔧", "☁️", "📊", "🧩", "💬", "🚀",
];

export function timeAgo(date: string | Date) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return "vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)} ngày trước`;
  return new Date(date).toLocaleDateString("vi-VN");
}

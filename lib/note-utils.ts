import type { INote } from "@/models/Note";

/** Tạo đoạn trích ngắn cho card từ nội dung note. */
export function buildPreview(note: Pick<INote, "type" | "question" | "answer"> & { contentText?: string }) {
  const src =
    note.type === "qa" ? [note.answer, note.contentText].filter(Boolean).join(" ") : note.contentText ?? "";
  return src.replace(/\s+/g, " ").trim().slice(0, 180);
}

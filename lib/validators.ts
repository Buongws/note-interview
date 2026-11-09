import { z } from "zod";
import { NOTE_STATUSES, NOTE_TYPES } from "@/models/Note";

export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, "Username tối thiểu 2 ký tự")
    .max(32, "Username tối đa 32 ký tự")
    .regex(/^[\p{L}\p{N}_.-]+$/u, "Chỉ dùng chữ, số, _ . -"),
});

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Màu phải dạng #rrggbb");

export const topicCreateSchema = z.object({
  name: z.string().trim().min(1, "Nhập tên chủ đề").max(60),
  icon: z.string().trim().min(1).max(8).default("📁"),
  color: color.default("#6366f1"),
});
export const topicUpdateSchema = topicCreateSchema.partial();
export const topicReorderSchema = z.object({ ids: z.array(z.string()).min(1) });

const tags = z
  .array(z.string().trim().min(1).max(30))
  .max(20)
  .transform((t) => Array.from(new Set(t.map((x) => x.toLowerCase()))));

export const noteCreateSchema = z.object({
  topicId: z.string().min(1),
  title: z.string().trim().max(200).default(""),
  content: z.any().optional(),
  contentText: z.string().max(200_000).optional(),
  tags: tags.optional(),
  type: z.enum(NOTE_TYPES).default("knowledge"),
  question: z.string().max(10_000).optional(),
  answer: z.string().max(50_000).optional(),
  status: z.enum(NOTE_STATUSES).default("learning"),
  pinned: z.boolean().default(false),
});

export const noteUpdateSchema = z.object({
  topicId: z.string().min(1).optional(),
  title: z.string().trim().max(200).optional(),
  content: z.any().optional(),
  contentText: z.string().max(200_000).optional(),
  tags: tags.optional(),
  type: z.enum(NOTE_TYPES).optional(),
  question: z.string().max(10_000).optional(),
  answer: z.string().max(50_000).optional(),
  status: z.enum(NOTE_STATUSES).optional(),
  pinned: z.boolean().optional(),
});

export const noteQuerySchema = z.object({
  topicId: z.string().optional(),
  tag: z.string().optional(),
  status: z.enum(NOTE_STATUSES).optional(),
  type: z.enum(NOTE_TYPES).optional(),
  q: z.string().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

// ---- Drawings (Excalidraw) ----
export const drawingCreateSchema = z.object({ title: z.string().trim().max(120).default("") });
export const drawingUpdateSchema = z.object({
  title: z.string().trim().max(120).optional(),
  data: z
    .object({
      elements: z.array(z.any()).max(20_000),
      appState: z.record(z.string(), z.any()).default({}),
      files: z.record(z.string(), z.any()).default({}),
    })
    .optional(),
});

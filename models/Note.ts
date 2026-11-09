import { Schema, model, models, type Model, type Types } from "mongoose";
import { normalizeSearch } from "@/lib/search";

export const NOTE_TYPES = ["knowledge", "qa"] as const;
export const NOTE_STATUSES = ["learning", "reviewing", "mastered"] as const;
export type NoteType = (typeof NOTE_TYPES)[number];
export type NoteStatus = (typeof NOTE_STATUSES)[number];

export interface INote {
  _id: string;
  userId: Types.ObjectId;
  topicId: Types.ObjectId;
  title: string;
  content: unknown; // JSON blocks của BlockNote
  contentText: string; // plain text của content, dùng cho tìm kiếm
  preview: string; // đoạn trích ngắn hiển thị trên card
  searchText: string; // title+nội dung+tag đã bỏ dấu, dùng cho tìm kiếm
  tags: string[];
  type: NoteType;
  question?: string;
  answer?: string;
  status: NoteStatus;
  pinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    topicId: { type: Schema.Types.ObjectId, ref: "Topic", required: true, index: true },
    title: { type: String, default: "", trim: true },
    content: { type: Schema.Types.Mixed, default: [] },
    contentText: { type: String, default: "" },
    preview: { type: String, default: "" },
    searchText: { type: String, default: "" },
    tags: { type: [String], default: [], index: true },
    type: { type: String, enum: NOTE_TYPES, default: "knowledge" },
    question: { type: String, default: "" },
    answer: { type: String, default: "" },
    status: { type: String, enum: NOTE_STATUSES, default: "learning" },
    pinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Tự cập nhật searchText mỗi lần validate (create / save / insertMany)
NoteSchema.pre("validate", function () {
  this.searchText = normalizeSearch(
    [this.title, this.question, this.answer, this.contentText, (this.tags ?? []).join(" ")].join(" ")
  );
});

// Compound index khớp các query chính: list theo topic, "sửa gần đây", lọc status
NoteSchema.index({ userId: 1, topicId: 1, pinned: -1, updatedAt: -1 });
NoteSchema.index({ userId: 1, updatedAt: -1 });
NoteSchema.index({ userId: 1, status: 1 });

export const Note: Model<INote> = (models.Note as Model<INote>) || model<INote>("Note", NoteSchema);

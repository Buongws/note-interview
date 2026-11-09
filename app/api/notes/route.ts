import { Types } from "mongoose";
import { Note } from "@/models/Note";
import { Topic } from "@/models/Topic";
import { badRequest, isValidId, ok, parseBody, withUser } from "@/lib/api";
import { noteCreateSchema, noteQuerySchema } from "@/lib/validators";
import { escapeRegex } from "@/lib/escape";
import { normalizeSearch } from "@/lib/search";
import { buildPreview } from "@/lib/note-utils";

// Danh sách note: không trả về `content`/`contentText` để response nhẹ
const LIST_FIELDS = "-content -contentText -searchText";

// GET /api/notes?topicId=&tag=&status=&type=&q=&limit=
export const GET = withUser(async (req, { userId }) => {
  const sp = Object.fromEntries(new URL(req.url).searchParams);
  const query = noteQuerySchema.parse(sp);
  const filter: Record<string, unknown> = { userId: new Types.ObjectId(userId) };

  if (query.topicId) {
    if (!isValidId(query.topicId)) return badRequest("topicId không hợp lệ");
    filter.topicId = new Types.ObjectId(query.topicId);
  }
  if (query.tag) filter.tags = query.tag.toLowerCase();
  if (query.status) filter.status = query.status;
  if (query.type) filter.type = query.type;
  if (query.q?.trim()) {
    // searchText đã bỏ dấu + lowercase -> khớp "ghi chu" với "Ghi chú", không cần cờ "i"
    filter.searchText = new RegExp(escapeRegex(normalizeSearch(query.q.trim())));
  }

  const notes = await Note.find(filter)
    .select(LIST_FIELDS)
    .sort({ pinned: -1, updatedAt: -1 })
    .limit(query.limit ?? 500)
    .lean();
  return ok(notes);
});

export const POST = withUser(async (req, { userId }) => {
  const data = await parseBody(req, noteCreateSchema);
  if (!isValidId(data.topicId)) return badRequest("topicId không hợp lệ");
  // topic phải thuộc về user
  if (!(await Topic.exists({ _id: data.topicId, userId }))) return badRequest("Topic không tồn tại");

  const note = await Note.create({
    ...data,
    userId,
    content: data.content ?? [],
    preview: buildPreview(data),
  });
  const { searchText: _s, contentText: _t, ...rest } = note.toObject();
  return ok(rest, { status: 201 });
});

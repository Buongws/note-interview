import { Note } from "@/models/Note";
import { Topic } from "@/models/Topic";
import { badRequest, isValidId, notFound, ok, parseBody, withUser } from "@/lib/api";
import { noteUpdateSchema } from "@/lib/validators";
import { buildPreview } from "@/lib/note-utils";

type P = { id: string };

export const GET = withUser<P>(async (_req, { userId, params }) => {
  if (!isValidId(params.id)) return notFound();
  const note = await Note.findOne({ _id: params.id, userId }).lean();
  return note ? ok(note) : notFound();
});

export const PATCH = withUser<P>(async (req, { userId, params }) => {
  if (!isValidId(params.id)) return notFound();
  const data = await parseBody(req, noteUpdateSchema);

  if (data.topicId) {
    if (!isValidId(data.topicId) || !(await Topic.exists({ _id: data.topicId, userId })))
      return badRequest("Topic không tồn tại");
  }

  const note = await Note.findOne({ _id: params.id, userId });
  if (!note) return notFound();

  note.set(data);
  // cập nhật preview khi nội dung thay đổi
  if (data.contentText !== undefined || data.answer !== undefined || data.type !== undefined) {
    note.preview = buildPreview({
      type: note.type,
      question: note.question,
      answer: note.answer,
      contentText: note.contentText,
    });
  }
  if (data.content !== undefined) note.markModified("content");
  await note.save();

  const { content: _c, contentText: _t, searchText: _s, ...rest } = note.toObject();
  return ok(rest);
});

export const DELETE = withUser<P>(async (_req, { userId, params }) => {
  if (!isValidId(params.id)) return notFound();
  const res = await Note.deleteOne({ _id: params.id, userId });
  return res.deletedCount ? ok({ ok: true }) : notFound();
});

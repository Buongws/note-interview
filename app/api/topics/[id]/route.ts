import { Topic } from "@/models/Topic";
import { Note } from "@/models/Note";
import { isValidId, notFound, ok, parseBody, withUser } from "@/lib/api";
import { topicUpdateSchema } from "@/lib/validators";

type P = { id: string };

export const GET = withUser<P>(async (_req, { userId, params }) => {
  if (!isValidId(params.id)) return notFound();
  const topic = await Topic.findOne({ _id: params.id, userId }).lean();
  return topic ? ok(topic) : notFound();
});

export const PATCH = withUser<P>(async (req, { userId, params }) => {
  if (!isValidId(params.id)) return notFound();
  const data = await parseBody(req, topicUpdateSchema);
  const topic = await Topic.findOneAndUpdate({ _id: params.id, userId }, { $set: data }, { returnDocument: "after" }).lean();
  return topic ? ok(topic) : notFound();
});

// Xoá topic -> xoá luôn toàn bộ note bên trong
export const DELETE = withUser<P>(async (_req, { userId, params }) => {
  if (!isValidId(params.id)) return notFound();
  const topic = await Topic.findOneAndDelete({ _id: params.id, userId });
  if (!topic) return notFound();
  await Note.deleteMany({ topicId: params.id, userId });
  return ok({ ok: true });
});

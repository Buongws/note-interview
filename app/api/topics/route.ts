import { Types } from "mongoose";
import { Topic } from "@/models/Topic";
import { Note } from "@/models/Note";
import { ok, parseBody, withUser } from "@/lib/api";
import { topicCreateSchema, topicReorderSchema } from "@/lib/validators";

// GET: danh sách topic của user + số note mỗi topic
export const GET = withUser(async (_req, { userId }) => {
  const uid = new Types.ObjectId(userId);
  const [topics, counts] = await Promise.all([
    Topic.find({ userId: uid }).sort({ order: 1, createdAt: 1 }).lean(),
    Note.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { userId: uid } },
      { $group: { _id: "$topicId", count: { $sum: 1 } } },
    ]),
  ]);
  const map = new Map(counts.map((c) => [String(c._id), c.count]));
  return ok(topics.map((t) => ({ ...t, noteCount: map.get(String(t._id)) ?? 0 })));
});

// POST: tạo topic mới (xếp cuối danh sách)
export const POST = withUser(async (req, { userId }) => {
  const data = await parseBody(req, topicCreateSchema);
  const last = await Topic.findOne({ userId }).sort({ order: -1 }).lean();
  const topic = await Topic.create({ ...data, userId, order: (last?.order ?? -1) + 1 });
  return ok({ ...topic.toObject(), noteCount: 0 }, { status: 201 });
});

// PUT: lưu thứ tự sau khi kéo thả { ids: [...] }
export const PUT = withUser(async (req, { userId }) => {
  const { ids } = await parseBody(req, topicReorderSchema);
  await Topic.bulkWrite(
    ids.map((id, order) => ({
      updateOne: { filter: { _id: id, userId }, update: { $set: { order } } },
    }))
  );
  return ok({ ok: true });
});

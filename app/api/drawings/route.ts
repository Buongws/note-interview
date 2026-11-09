import { Types } from "mongoose";
import { Drawing } from "@/models/Drawing";
import { ok, parseBody, withUser } from "@/lib/api";
import { drawingCreateSchema } from "@/lib/validators";

// Danh sách bản vẽ: không trả `data` (nặng), chỉ metadata
export const GET = withUser(async (_req, { userId }) => {
  const list = await Drawing.aggregate([
    { $match: { userId: new Types.ObjectId(userId) } },
    { $sort: { updatedAt: -1 } },
    { $limit: 200 },
    { $project: { title: 1, createdAt: 1, updatedAt: 1, shapes: { $size: { $ifNull: ["$data.elements", []] } } } },
  ]);
  return ok(list);
});

export const POST = withUser(async (req, { userId }) => {
  const { title } = await parseBody(req, drawingCreateSchema);
  const d = await Drawing.create({ userId, title });
  return ok({ _id: d._id, title: d.title, createdAt: d.createdAt, updatedAt: d.updatedAt, shapes: 0 }, { status: 201 });
});

import { Types } from "mongoose";
import { Note } from "@/models/Note";
import { ok, withUser } from "@/lib/api";

// Thống kê cho Dashboard
export const GET = withUser(async (_req, { userId }) => {
  const uid = new Types.ObjectId(userId);
  const [byStatus, recent, byType] = await Promise.all([
    Note.aggregate<{ _id: string; count: number }>([
      { $match: { userId: uid } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Note.find({ userId: uid }).select("-content -contentText -searchText").sort({ updatedAt: -1 }).limit(8).lean(),
    Note.aggregate<{ _id: string; count: number }>([
      { $match: { userId: uid } },
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]),
  ]);
  const status = { learning: 0, reviewing: 0, mastered: 0 } as Record<string, number>;
  byStatus.forEach((s) => (status[s._id] = s.count));
  const types = { knowledge: 0, qa: 0 } as Record<string, number>;
  byType.forEach((s) => (types[s._id] = s.count));
  const total = Object.values(status).reduce((a, b) => a + b, 0);
  return ok({ total, status, types, recent });
});

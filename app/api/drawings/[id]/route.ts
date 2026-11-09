import { Drawing } from "@/models/Drawing";
import { isValidId, notFound, ok, parseBody, withUser } from "@/lib/api";
import { drawingUpdateSchema } from "@/lib/validators";

type P = { id: string };
const MAX_DRAWING_BYTES = 4_000_000; // Vercel giới hạn body ~4.5MB

export const GET = withUser<P>(async (_req, { userId, params }) => {
  if (!isValidId(params.id)) return notFound();
  const d = await Drawing.findOne({ _id: params.id, userId }).lean();
  return d ? ok(d) : notFound();
});

export const PATCH = withUser<P>(async (req, { userId, params }) => {
  if (!isValidId(params.id)) return notFound();
  const data = await parseBody(req, drawingUpdateSchema, MAX_DRAWING_BYTES);
  const d = await Drawing.findOneAndUpdate(
    { _id: params.id, userId },
    { $set: data },
    { returnDocument: "after", projection: { data: 0 } }
  ).lean();
  return d ? ok(d) : notFound();
});

export const DELETE = withUser<P>(async (_req, { userId, params }) => {
  if (!isValidId(params.id)) return notFound();
  const r = await Drawing.deleteOne({ _id: params.id, userId });
  return r.deletedCount ? ok({ ok: true }) : notFound();
});

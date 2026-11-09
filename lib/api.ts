import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import mongoose from "mongoose";
import { getUserId } from "./auth";
import { connectDB } from "./mongodb";

type Ctx<P> = { params: Promise<P> };
type Handler<P> = (req: Request, ctx: { userId: string; params: P }) => Promise<Response>;

/**
 * Bọc Route Handler: kiểm tra đăng nhập, kết nối DB, bắt lỗi (Zod -> 400, còn lại -> 500).
 * Mọi query trong handler PHẢI lọc theo `userId` để mỗi user chỉ thấy dữ liệu của mình.
 */
export function withUser<P = Record<string, never>>(handler: Handler<P>) {
  return async (req: Request, ctx: Ctx<P>) => {
    try {
      const userId = await getUserId();
      if (!userId) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
      await connectDB();
      const params = (await ctx?.params) as P;
      return await handler(req, { userId, params });
    } catch (err) {
      return errorResponse(err);
    }
  };
}

export function errorResponse(err: unknown) {
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ", issues: err.issues.map((i) => ({ path: i.path, message: i.message })) },
      { status: 400 }
    );
  }
  if (err instanceof PayloadTooLarge) {
    return NextResponse.json({ error: "Nội dung quá lớn" }, { status: 413 });
  }
  console.error(err);
  return NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 });
}

/** Parse JSON body bằng Zod schema. */
export class PayloadTooLarge extends Error {}

/** Parse JSON body bằng Zod; từ chối body > maxBytes (mặc định 3MB, Vercel giới hạn 4.5MB). */
export async function parseBody<T>(req: Request, schema: ZodType<T>, maxBytes = 3_000_000): Promise<T> {
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > maxBytes) throw new PayloadTooLarge();
  const text = await req.text();
  if (text.length > maxBytes) throw new PayloadTooLarge();
  let body: unknown = {};
  try { body = text ? JSON.parse(text) : {}; } catch { /* body hỏng -> Zod báo thiếu field */ }
  return schema.parse(body);
}

export const isValidId = (id: string) => mongoose.isValidObjectId(id);
export const notFound = (msg = "Không tìm thấy") => NextResponse.json({ error: msg }, { status: 404 });
export const badRequest = (msg: string) => NextResponse.json({ error: msg }, { status: 400 });
export const ok = <T>(data: T, init?: ResponseInit) => NextResponse.json(data, init);

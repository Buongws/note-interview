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
  console.error(err);
  return NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 });
}

/** Parse JSON body bằng Zod schema. */
export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  const body = await req.json().catch(() => ({}));
  return schema.parse(body);
}

export const isValidId = (id: string) => mongoose.isValidObjectId(id);
export const notFound = (msg = "Không tìm thấy") => NextResponse.json({ error: msg }, { status: 404 });
export const badRequest = (msg: string) => NextResponse.json({ error: msg }, { status: 400 });
export const ok = <T>(data: T, init?: ResponseInit) => NextResponse.json(data, init);

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { setSessionCookie } from "@/lib/auth";
import { errorResponse, parseBody } from "@/lib/api";
import { loginSchema } from "@/lib/validators";

// Đăng nhập chỉ bằng username: chưa có thì tự tạo.
export async function POST(req: Request) {
  try {
    const { username } = await parseBody(req, loginSchema);
    await connectDB();
    const name = username.toLowerCase();
    // upsert nguyên tử -> không bị race khi 2 request cùng tạo user
    const user = await User.findOneAndUpdate(
      { username: name },
      { $setOnInsert: { username: name } },
      { upsert: true, returnDocument: "after" }
    ).lean();
    await setSessionCookie(String(user!._id));
    return NextResponse.json({ user: { id: String(user!._id), username: user!.username } });
  } catch (err) {
    return errorResponse(err);
  }
}

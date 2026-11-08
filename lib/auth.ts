import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, verifySession } from "./session";
import { connectDB } from "./mongodb";
import { User } from "@/models/User";

/** Lấy userId từ cookie (đã verify chữ ký). */
export async function getUserId(): Promise<string | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/** Lấy user hiện tại (dùng trong Server Component). */
export async function getCurrentUser() {
  const userId = await getUserId();
  if (!userId) return null;
  await connectDB();
  try {
    const user = await User.findById(userId).lean();
    return user ? { id: String(user._id), username: user.username } : null;
  } catch {
    return null; // userId không hợp lệ
  }
}

export async function setSessionCookie(userId: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, await signSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

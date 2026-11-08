// Ký / xác thực cookie phiên bằng Web Crypto (chạy được cả ở Edge middleware lẫn Node).
export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 ngày

const enc = new TextEncoder();

function secret() {
  // Trên production nên đặt SESSION_SECRET; dev có giá trị mặc định để chạy ngay.
  return process.env.SESSION_SECRET || "dev-only-insecure-secret-change-me";
}

// Cache key: middleware chạy ở MỌI request, không import lại mỗi lần
let keyPromise: Promise<CryptoKey> | null = null;
const getKey = () =>
  (keyPromise ??= crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]));

async function hmac(value: string): Promise<string> {
  const key = await getKey();
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(value));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Cookie value có dạng `userId.signature`. */
export async function signSession(userId: string): Promise<string> {
  return `${userId}.${await hmac(userId)}`;
}

/** Trả về userId nếu chữ ký hợp lệ, ngược lại null. */
export async function verifySession(value?: string | null): Promise<string | null> {
  if (!value) return null;
  const idx = value.lastIndexOf(".");
  if (idx < 1) return null;
  const userId = value.slice(0, idx);
  const sig = value.slice(idx + 1);
  const expected = await hmac(userId);
  if (sig.length !== expected.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0 ? userId : null;
}

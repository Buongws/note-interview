import mongoose from "mongoose";

/**
 * Cached connection: trong dev, Next.js hot-reload re-evaluate module liên tục.
 * Lưu promise vào `globalThis` để không mở thêm connection mỗi lần reload.
 */
type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };

const globalWithMongoose = globalThis as typeof globalThis & { _mongoose?: Cache };
const cached: Cache = (globalWithMongoose._mongoose ??= { conn: null, promise: null });

export async function connectDB(): Promise<typeof mongoose> {
  // Đọc env lazily (trong hàm) để script seed kịp load dotenv trước.
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Thiếu biến môi trường MONGODB_URI (xem .env.example)");

  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, { bufferCommands: false, maxPoolSize: 10, serverSelectionTimeoutMS: 8000 });
  }
  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null; // cho phép thử lại lần sau
    throw err;
  }
  return cached.conn;
}

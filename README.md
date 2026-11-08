# 📚 Interview Note

Web app ghi chú kiến thức để ôn phỏng vấn — giống Notion nhưng đơn giản, cá nhân hoá.

**Stack:** Next.js 15 (App Router, TS) · MongoDB + Mongoose · Tailwind CSS · BlockNote editor · SWR · dnd-kit · Zod

## Tính năng
- Đăng nhập chỉ bằng username (chưa có thì tự tạo), cookie httpOnly có chữ ký, middleware chặn khi chưa login
- Sidebar topic: emoji + màu, thêm/sửa/xoá, **kéo thả sắp xếp**, đếm số note
- Danh sách note dạng card/list, lọc theo status + tag, ghim note
- Editor block (heading, bullet, checklist, quote, code block highlight), **autosave sau 1s**, hiện "Saved"
- Note Q&A + chế độ **Ôn tập** flashcard (Space lật, ← Chưa nhớ, → Nhớ)
- Tìm kiếm toàn cục **Ctrl/Cmd + K** (title, nội dung, tag, câu hỏi/đáp án)
- Dashboard, Dark/Light mode, responsive (sidebar thành drawer trên mobile)

## Cấu trúc thư mục
```
app/
  (app)/                 # khu vực cần đăng nhập (layout có sidebar)
    page.tsx             # Dashboard
    topics/[id]/page.tsx # danh sách note của topic
    notes/[id]/page.tsx  # trang chi tiết + editor
    review/page.tsx      # ôn tập flashcard
  login/page.tsx
  api/
    auth/{login,logout,me}/route.ts
    topics/route.ts, topics/[id]/route.ts
    notes/route.ts,  notes/[id]/route.ts
    stats/route.ts
components/              # UI: sidebar, note-editor, block-editor, review-session, dashboard…
  ui/                    # button, input, dialog, dropdown-menu (kiểu shadcn/ui)
lib/                     # mongodb (cached), auth, session (HMAC), api helper, validators (Zod)…
models/                  # User, Topic, Note (Mongoose)
scripts/seed.ts          # dữ liệu mẫu
middleware.ts            # chặn route khi chưa đăng nhập
```

## Cài đặt & chạy
```bash
npm install
cp .env.example .env.local     # rồi điền MONGODB_URI (và SESSION_SECRET)
npm run dev                    # http://localhost:3000
```

### Biến môi trường (`.env.local`)
| Biến | Mô tả |
|---|---|
| `MONGODB_URI` | Connection string MongoDB Atlas. **Nhớ thêm tên DB** trước dấu `?`, ví dụ `.../interview-note?retryWrites=true&w=majority` |
| `SESSION_SECRET` | Chuỗi ngẫu nhiên để ký cookie (`openssl rand -hex 32`). Bắt buộc đặt khi deploy |

> `.env.local` đã nằm trong `.gitignore` — **không commit**. Trên Atlas, vào *Network Access* cho phép IP của bạn (hoặc `0.0.0.0/0` khi deploy Vercel).

### Seed dữ liệu mẫu
```bash
npm run seed
```
Tạo user **`demo`** với 5 topic (Technical, AI Questions, System Design, Behavioral, Database) và 8 note mẫu (Event Loop, SSR/SSG/CSR, RAG, Prompt engineering vs Fine-tuning…). Chạy lại được nhiều lần (chỉ reset dữ liệu của `demo`). Đăng nhập bằng username `demo` để xem.

## API
Tất cả (trừ login) yêu cầu cookie đăng nhập; mọi truy vấn lọc theo `userId`; input validate bằng Zod.

| Method | Endpoint | Ghi chú |
|---|---|---|
| POST | `/api/auth/login` `{username}` | tạo user nếu chưa có |
| POST | `/api/auth/logout` | |
| GET | `/api/auth/me` | |
| GET/POST | `/api/topics` | GET kèm `noteCount`; `PUT` `{ids:[...]}` để lưu thứ tự |
| GET/PATCH/DELETE | `/api/topics/[id]` | xoá topic sẽ xoá note bên trong |
| GET/POST | `/api/notes` | GET: `?topicId=&tag=&status=&type=&q=&limit=` |
| GET/PATCH/DELETE | `/api/notes/[id]` | |
| GET | `/api/stats` | số liệu Dashboard |

## Deploy lên Vercel
1. Push code lên GitHub (đảm bảo `.env.local` không bị commit).
2. Vercel → **Add New → Project** → import repo (framework tự nhận Next.js).
3. **Settings → Environment Variables**: thêm `MONGODB_URI` và `SESSION_SECRET`.
4. MongoDB Atlas → **Network Access** → thêm `0.0.0.0/0` (Vercel dùng IP động).
5. Deploy. Chạy `npm run seed` ở máy local (trỏ cùng `MONGODB_URI`) nếu muốn có dữ liệu mẫu.

## Lưu ý
- Đăng nhập **không có mật khẩu** theo thiết kế: ai biết username đều vào được. Phù hợp dùng cá nhân; đừng lưu thông tin nhạy cảm.
- Tìm kiếm dùng regex trên MongoDB — đủ nhanh cho ghi chú cá nhân. Nếu dữ liệu lớn, cân nhắc text index / Atlas Search.
- Dùng Mantine 8 (không phải 9) vì BlockNote 0.57 + Next 15 vendored React 19.1.

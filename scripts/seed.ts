/**
 * Seed dữ liệu mẫu cho user "demo".   Chạy: npm run seed
 * An toàn chạy lại nhiều lần: chỉ xoá & tạo lại dữ liệu của user "demo", không đụng user khác.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import mongoose from "mongoose";
import { connectDB } from "../lib/mongodb";
import { blocksToText } from "../lib/blocks";
import { User } from "../models/User";
import { Topic } from "../models/Topic";
import { Note } from "../models/Note";

// ---- helper tạo block BlockNote ----
const t = (text: string, styles: Record<string, boolean> = {}) => ({ type: "text", text, styles });
const h = (level: 1 | 2 | 3, text: string) => ({ type: "heading", props: { level }, content: [t(text)], children: [] });
const p = (...c: ReturnType<typeof t>[]) => ({ type: "paragraph", content: c, children: [] });
const li = (text: string) => ({ type: "bulletListItem", content: [t(text)], children: [] });
const check = (text: string, checked = false) => ({ type: "checkListItem", props: { checked }, content: [t(text)], children: [] });
const quote = (text: string) => ({ type: "quote", content: [t(text)], children: [] });
const code = (language: string, text: string) => ({ type: "codeBlock", props: { language }, content: [t(text)], children: [] });

const topics = [
  { key: "tech", name: "Technical", icon: "💻", color: "#3b82f6" },
  { key: "ai", name: "AI Questions", icon: "🤖", color: "#8b5cf6" },
  { key: "sd", name: "System Design", icon: "🏗️", color: "#f97316" },
  { key: "beh", name: "Behavioral", icon: "💬", color: "#ec4899" },
  { key: "db", name: "Database", icon: "🗄️", color: "#14b8a6" },
];

type Seed = {
  topic: string; title: string; type?: "knowledge" | "qa"; status?: "learning" | "reviewing" | "mastered";
  tags: string[]; pinned?: boolean; question?: string; answer?: string; content?: unknown[];
};

const notes: Seed[] = [
  {
    topic: "tech", title: "Event Loop trong JavaScript", status: "reviewing", pinned: true, tags: ["javascript", "async"],
    content: [
      h(2, "Tóm tắt"),
      p(t("JavaScript chạy "), t("single-thread", { bold: true }), t(". Event loop giúp xử lý bất đồng bộ mà không chặn luồng chính.")),
      h(3, "Các thành phần"),
      li("Call Stack: nơi thực thi code đồng bộ."),
      li("Web APIs / Node APIs: setTimeout, fetch, DOM events…"),
      li("Microtask queue: Promise.then, queueMicrotask, MutationObserver."),
      li("Macrotask queue: setTimeout, setInterval, I/O, UI events."),
      h(3, "Thứ tự thực thi"),
      quote("Sau mỗi macrotask, event loop chạy HẾT microtask queue rồi mới sang macrotask kế tiếp."),
      code("javascript", `console.log("1");\nsetTimeout(() => console.log("2"), 0);\nPromise.resolve().then(() => console.log("3"));\nconsole.log("4");\n// Output: 1, 4, 3, 2`),
      h(3, "Checklist ôn tập"),
      check("Giải thích được vì sao Promise chạy trước setTimeout(0)", true),
      check("Phân biệt microtask và macrotask"),
      check("Biết nextTick của Node.js khác gì microtask"),
    ],
  },
  {
    topic: "tech", title: "Khác nhau giữa SSR, SSG, CSR", status: "learning", tags: ["react", "nextjs", "rendering"],
    content: [
      h(2, "So sánh nhanh"),
      li("CSR (Client-Side Rendering): server trả HTML rỗng, trình duyệt tải JS rồi render. Tốt cho app tương tác nhiều, SEO kém hơn."),
      li("SSR (Server-Side Rendering): render HTML trên server MỖI request. SEO tốt, dữ liệu luôn mới, nhưng tốn tài nguyên server."),
      li("SSG (Static Site Generation): render HTML lúc build, phục vụ qua CDN. Nhanh nhất, phù hợp nội dung ít thay đổi."),
      li("ISR: SSG + tái tạo trang theo chu kỳ (revalidate)."),
      h(3, "Khi nào chọn gì?"),
      p(t("Blog / docs → "), t("SSG", { bold: true }), t(". Dashboard sau đăng nhập → "), t("CSR", { bold: true }), t(". Trang sản phẩm cần SEO và dữ liệu thay đổi → "), t("SSR/ISR", { bold: true }), t(".")),
      code("tsx", `// Next.js App Router\nexport const revalidate = 60; // ISR: tái tạo tối đa mỗi 60s\nexport default async function Page() {\n  const data = await fetch("https://api.example.com/posts").then(r => r.json());\n  return <PostList posts={data} />;\n}`),
    ],
  },
  {
    topic: "tech", type: "qa", title: "Closure là gì?", status: "learning", tags: ["javascript"],
    question: "Closure trong JavaScript là gì? Cho ví dụ ứng dụng thực tế.",
    answer: "Closure là hàm \"nhớ\" được biến ở phạm vi (scope) nơi nó được tạo ra, kể cả khi hàm đó được gọi bên ngoài scope ấy.\n\nỨng dụng: private state (module pattern), currying, memoize, event handler giữ lại biến, React hooks (useState dựa trên closure).",
    content: [code("javascript", `function counter() {\n  let n = 0;\n  return () => ++n;\n}\nconst inc = counter();\ninc(); // 1\ninc(); // 2`)],
  },
  {
    topic: "ai", type: "qa", title: "RAG là gì?", status: "learning", tags: ["rag", "llm"], pinned: true,
    question: "RAG (Retrieval-Augmented Generation) là gì và vì sao cần dùng?",
    answer: "RAG là kỹ thuật truy xuất tài liệu liên quan từ nguồn tri thức bên ngoài (vector DB, search…) rồi đưa vào prompt để LLM trả lời dựa trên dữ liệu đó.\n\nLợi ích: giảm hallucination, cập nhật tri thức mà không cần train lại, có thể trích nguồn, kiểm soát dữ liệu riêng tư.\n\nPipeline: chunk tài liệu → embedding → lưu vector DB → (query) embed câu hỏi → top-k similarity search → ghép vào prompt → LLM sinh câu trả lời.",
    content: [h(3, "Điểm cần nhớ khi phỏng vấn"), li("Chiến lược chunking (kích thước, overlap) ảnh hưởng lớn đến chất lượng."), li("Hybrid search (BM25 + vector) và reranking giúp tăng độ chính xác."), li("Đánh giá: faithfulness, answer relevancy, context recall.")],
  },
  {
    topic: "ai", title: "Prompt engineering vs Fine-tuning", status: "reviewing", tags: ["llm", "fine-tuning", "prompt"],
    content: [
      h(2, "Prompt engineering"),
      li("Không thay đổi trọng số mô hình, chỉ tối ưu đầu vào (instruction, few-shot, chain-of-thought…)."),
      li("Nhanh, rẻ, dễ lặp; phù hợp bắt đầu mọi dự án."),
      h(2, "Fine-tuning"),
      li("Huấn luyện thêm trên dữ liệu riêng để thay đổi hành vi/phong cách/định dạng ổn định."),
      li("Tốn dữ liệu + chi phí, phải đánh giá kỹ; không phải cách tốt để \"nạp kiến thức\" mới (dùng RAG)."),
      h(2, "Quy tắc chọn"),
      quote("Thử prompt → thêm RAG nếu thiếu tri thức → fine-tune khi cần hành vi nhất quán hoặc giảm chi phí/độ trễ ở quy mô lớn."),
    ],
  },
  {
    topic: "sd", title: "Thiết kế URL Shortener", status: "learning", tags: ["system-design"],
    content: [
      h(2, "Yêu cầu"), li("Tạo link ngắn từ link dài, redirect nhanh, đọc nhiều hơn ghi (~100:1)."),
      h(2, "Thiết kế"), li("ID: base62 từ counter phân tán hoặc hash + xử lý va chạm."), li("Lưu trữ: key-value (DynamoDB/Redis) hoặc SQL có index trên short_code."), li("Cache: Redis cho hot links; CDN cho redirect."),
      check("Ước lượng QPS và dung lượng lưu trữ"), check("Bàn về analytics và hết hạn link"),
    ],
  },
  {
    topic: "beh", type: "qa", title: "Kể về một lần thất bại", status: "learning", tags: ["star"],
    question: "Hãy kể về một lần bạn thất bại và bạn đã học được gì?",
    answer: "Dùng khung STAR:\n- Situation: bối cảnh dự án.\n- Task: trách nhiệm của bạn.\n- Action: bạn đã làm gì (nhấn mạnh phần học hỏi/khắc phục).\n- Result: kết quả + bài học áp dụng sau này.",
  },
  {
    topic: "db", type: "qa", title: "Index hoạt động thế nào?", status: "mastered", tags: ["sql", "index"],
    question: "Database index hoạt động như thế nào và đánh đổi là gì?",
    answer: "Index (thường là B-Tree) giữ các giá trị cột đã sắp xếp kèm con trỏ tới dòng dữ liệu, giúp tìm kiếm O(log n) thay vì quét toàn bảng.\n\nĐánh đổi: tốn dung lượng, làm chậm INSERT/UPDATE/DELETE vì phải cập nhật index. Nên index các cột hay dùng trong WHERE/JOIN/ORDER BY, chú ý thứ tự cột của composite index.",
  },
];

async function main() {
  await connectDB();
  const username = "demo";

  const user = await User.findOneAndUpdate({ username }, { $setOnInsert: { username } }, { upsert: true, returnDocument: "after" });
  await Note.deleteMany({ userId: user._id });
  await Topic.deleteMany({ userId: user._id });

  const created = await Topic.insertMany(topics.map((x, order) => ({ userId: user._id, name: x.name, icon: x.icon, color: x.color, order })));
  const byKey = new Map(topics.map((x, i) => [x.key, created[i]._id]));

  await Note.insertMany(
    notes.map((n) => {
      const contentText = blocksToText(n.content ?? []);
      const type = n.type ?? "knowledge";
      return {
        userId: user._id,
        topicId: byKey.get(n.topic),
        title: n.title,
        type,
        status: n.status ?? "learning",
        tags: n.tags,
        pinned: n.pinned ?? false,
        question: n.question ?? "",
        answer: n.answer ?? "",
        content: n.content ?? [],
        contentText,
        preview: (type === "qa" ? n.answer ?? "" : contentText).replace(/\s+/g, " ").slice(0, 180),
      };
    })
  );

  console.log(`✅ Seed xong: ${topics.length} topics, ${notes.length} notes cho user "${username}"`);
  await mongoose.disconnect();
}

main().catch((e) => { console.error("❌ Seed lỗi:", e.message); process.exit(1); });

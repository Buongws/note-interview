// Bảng emoji gọn cho chủ đề: "emoji keyword1 keyword2 ..." (tìm theo từ khoá, có tiếng Việt)
const raw = {
  "Phổ biến": "📁 thư mục folder|💻 máy tính code laptop|🤖 ai robot|🏗️ kiến trúc system design|🧠 não tư duy brain|⚡ nhanh điện lightning|📚 sách học books|🎯 mục tiêu target|🚀 tên lửa launch|💬 chat giao tiếp behavioral|🔥 hot lửa|⭐ sao star|💡 ý tưởng idea|✅ xong check|📌 ghim pin|🔖 đánh dấu bookmark",
  "Công nghệ": "🌐 web internet|🗄️ database cơ sở dữ liệu|☁️ cloud đám mây|🔐 bảo mật security lock|🔑 khoá key|🔧 công cụ tool wrench|⚙️ cài đặt gear|🧩 ghép puzzle|🧪 test thử nghiệm|🐛 bug lỗi|📡 mạng network|🖥️ desktop màn hình|📱 mobile điện thoại|🔌 plugin api|🧰 toolbox|📦 package gói|🛠️ build|🧮 thuật toán algorithm|📊 biểu đồ chart|📈 tăng trưởng growth|💾 lưu save|🔍 tìm search|🧬 gen dna|🕸️ web spider|♻️ tái chế refactor|🔁 lặp loop|🧵 thread luồng|🗂️ phân loại|🖱️ chuột mouse|⌨️ bàn phím keyboard|🧱 tường lửa block|🪪 id danh tính|📲 app|🛰️ vệ tinh|🔋 pin battery|🪲 debug|🧯 chữa cháy hotfix|🔗 link liên kết|⛓️ chain blockchain|🧊 cache lạnh|🗜️ nén compress|📤 upload|📥 download|🛡️ shield bảo vệ",
  "Ngôn ngữ": "🟨 javascript js|⚛️ react|🟦 typescript ts|🐍 python|☕ java cà phê|🦀 rust|🐹 go golang|💎 ruby|🐘 php|🍃 mongodb node|🐳 docker|🅰️ angular|🟩 vue node|🐧 linux|🍎 apple ios|🤖 android|🐙 git github|🔷 csharp dotnet",
  "Học tập": "📝 ghi chú note|📖 đọc đọc sách|🎓 tốt nghiệp học|✏️ bút pencil|📓 sổ notebook|🗒️ memo|📋 clipboard danh sách|🧾 hoá đơn|🏫 trường|🔬 nghiên cứu|📐 đo thước|🧑‍🎓 sinh viên student|📚 thư viện|🔭 kính viễn vọng|🧠 ghi nhớ memory|📎 đính kèm|🖊️ viết|🗃️ lưu trữ|🔖 bookmark|🧑‍💻 lập trình viên developer|👨‍🏫 giảng viên|🗣️ nói speaking|🤝 teamwork hợp tác|🏆 cúp thành tích|🥇 nhất|📅 lịch calendar|⏰ thời gian time|⏳ deadline",
  "Cảm xúc": "😀 vui|😎 ngầu|🤔 suy nghĩ|😅 toát mồ hôi|😴 buồn ngủ|🥳 ăn mừng|😤 cố gắng|🙌 hoan hô|👍 ok tốt|💪 mạnh strong|🙏 cảm ơn|❤️ yêu love|🎉 party|😮 ngạc nhiên",
  "Đồ vật": "🏠 nhà|🚗 xe|✈️ máy bay|🌍 trái đất|🌱 mầm cây|🌳 cây|🍕 pizza|🍜 phở mì|☕ cà phê|🎧 nhạc|🎮 game|🎨 vẽ design|📷 ảnh|🎬 phim|💼 công việc job|💰 tiền money|🏦 ngân hàng|🛒 mua sắm|⚖️ luật cân bằng|🧭 la bàn",
  "Ký hiệu": "✔️ đúng tick|❌ sai cross|⚠️ cảnh báo warning|❗ quan trọng|❓ câu hỏi question|ℹ️ thông tin info|🚫 cấm|🔴 đỏ red|🟠 cam orange|🟡 vàng yellow|🟢 xanh green|🔵 xanh dương blue|🟣 tím purple|⚫ đen black|⚪ trắng white|➕ thêm plus|➖ bớt minus|➡️ mũi tên phải arrow|⬅️ mũi tên trái|⬆️ lên up|⬇️ xuống down|🔄 đồng bộ sync|🔀 shuffle|🔔 thông báo bell|🔒 khoá lock|🔓 mở khoá|🏷️ nhãn tag|🚩 cờ flag|🏁 đích finish|💯 trăm điểm|🆕 mới new|🔝 top",
  "Động vật": "🐶 chó dog|🐱 mèo cat|🦊 cáo fox|🐼 gấu trúc panda|🦉 cú owl|🐝 ong bee|🦋 bướm butterfly|🐢 rùa turtle|🐙 bạch tuộc octopus|🦄 kỳ lân unicorn|🐧 chim cánh cụt penguin|🐬 cá heo dolphin|🦅 đại bàng eagle|🐜 kiến ant|🐞 bọ rùa bug|🦁 sư tử lion",
  "Thiên nhiên": "☀️ mặt trời sun|🌙 trăng moon|⭐ sao|🌈 cầu vồng rainbow|☔ mưa rain|❄️ tuyết snow|🌊 sóng wave|🌋 núi lửa|🏔️ núi mountain|🌸 hoa flower|🌻 hướng dương|🍀 may mắn clover|🍎 táo apple|🍌 chuối|☁️ mây cloud|⚡ sét",
} as const;

export interface EmojiItem { e: string; k: string }
export const EMOJI_GROUPS: Record<string, EmojiItem[]> = Object.fromEntries(
  Object.entries(raw).map(([group, str]) => [
    group,
    str.split("|").map((item) => {
      const [e, ...k] = item.split(" ");
      return { e, k: k.join(" ") };
    }),
  ])
);
export const ALL_EMOJIS = Object.values(EMOJI_GROUPS).flat();

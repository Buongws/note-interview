/** Escape ký tự đặc biệt để dùng chuỗi người dùng nhập trong RegExp an toàn. */
export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Lấy plain text từ JSON blocks của BlockNote (dùng cho tìm kiếm + preview).
 * Duyệt đệ quy và gom mọi trường `text` -> hoạt động cả với list lồng nhau, bảng, link.
 */
export function blocksToText(node: unknown): string {
  const parts: string[] = [];
  const walk = (n: unknown) => {
    if (Array.isArray(n)) return n.forEach(walk);
    if (n && typeof n === "object") {
      const obj = n as Record<string, unknown>;
      if (typeof obj.text === "string") parts.push(obj.text);
      // sau mỗi block (có `type` + `children`) thêm khoảng trắng để các dòng không dính nhau
      for (const key of ["content", "children", "rows", "cells"]) if (obj[key]) walk(obj[key]);
      if (typeof obj.type === "string" && "children" in obj) parts.push("\n");
    }
  };
  walk(node);
  return parts.join(" ").replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();
}

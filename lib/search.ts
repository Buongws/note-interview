/** Chuẩn hoá để tìm không phân biệt hoa/thường và dấu tiếng Việt ("ghi chu" khớp "Ghi chú"). */
export function normalizeSearch(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase();
}

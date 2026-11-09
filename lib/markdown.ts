/** Phần tối thiểu của BlockNoteEditor mà import/export Markdown cần. */
export interface MarkdownTarget {
  document: any[];
  tryParseMarkdownToBlocks: (md: string) => any[] | Promise<any[]>;
  blocksToMarkdownLossy: (blocks?: any[]) => string | Promise<string>;
  replaceBlocks: (remove: any[], insert: any[]) => unknown;
  insertBlocks: (blocks: any[], ref: any, placement: "before" | "after") => unknown;
  focus: () => void;
}

export const MAX_MD_BYTES = 2 * 1024 * 1024;

const isEmptyBlock = (b: any) =>
  b.type === "paragraph" && (!Array.isArray(b.content) || b.content.length === 0) && !(b.children?.length);

/**
 * Đọc nội dung Markdown và chèn vào editor (thay thế nếu note đang trống, ngược lại nối vào cuối).
 * Trả về số block đã chèn và tiêu đề gợi ý (heading H1 đầu tiên, đã được tách khỏi nội dung).
 */
export async function importMarkdown(
  editor: MarkdownTarget,
  raw: string,
  opts: { takeTitle: boolean }
): Promise<{ count: number; title?: string }> {
  const md = raw.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  let blocks = await editor.tryParseMarkdownToBlocks(md);
  let title: string | undefined;
  const first = blocks[0];
  if (opts.takeTitle && first?.type === "heading" && (first.props?.level ?? 1) === 1) {
    title = (Array.isArray(first.content) ? first.content : []).map((c: any) => c.text ?? "").join("").trim() || undefined;
    if (title) blocks = blocks.slice(1);
  }
  if (!blocks.length) return { count: 0, title };
  const doc = editor.document;
  if (doc.every(isEmptyBlock)) editor.replaceBlocks(doc, blocks);
  else editor.insertBlocks(blocks, doc[doc.length - 1], "after");
  return { count: blocks.length, title };
}

export async function exportMarkdown(editor: MarkdownTarget, title: string): Promise<string> {
  const body = await editor.blocksToMarkdownLossy(editor.document);
  return (title.trim() ? `# ${title.trim()}\n\n` : "") + body;
}

export function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Format nội dung editor: làm đẹp text + format code theo ngôn ngữ.
 * Prettier / sql-formatter được import động -> chỉ tải khi người dùng bấm Format.
 */

type Parser = { parser: string; plugins: string[] } | "json" | "sql";

// language id của BlockNote -> parser của Prettier
const LANGS: Record<string, Parser> = {
  javascript: { parser: "babel", plugins: ["babel", "estree"] },
  jsx: { parser: "babel", plugins: ["babel", "estree"] },
  typescript: { parser: "typescript", plugins: ["typescript", "estree"] },
  tsx: { parser: "typescript", plugins: ["typescript", "estree"] },
  css: { parser: "css", plugins: ["postcss"] },
  scss: { parser: "scss", plugins: ["postcss"] },
  less: { parser: "less", plugins: ["postcss"] },
  html: { parser: "html", plugins: ["html"] },
  "vue-html": { parser: "html", plugins: ["html"] },
  markdown: { parser: "markdown", plugins: ["markdown"] },
  mdx: { parser: "markdown", plugins: ["markdown"] },
  yaml: { parser: "yaml", plugins: ["yaml"] },
  json: "json",
  jsonc: "json",
  sql: "sql",
};

const pluginLoaders: Record<string, () => Promise<unknown>> = {
  babel: () => import("prettier/plugins/babel"),
  estree: () => import("prettier/plugins/estree"),
  typescript: () => import("prettier/plugins/typescript"),
  postcss: () => import("prettier/plugins/postcss"),
  html: () => import("prettier/plugins/html"),
  markdown: () => import("prettier/plugins/markdown"),
  yaml: () => import("prettier/plugins/yaml"),
};

export const isFormattable = (lang: string) => lang in LANGS;

/** Format 1 đoạn code. Trả về null nếu ngôn ngữ chưa hỗ trợ, ném lỗi nếu sai cú pháp. */
export async function formatCode(code: string, lang: string): Promise<string | null> {
  const spec = LANGS[lang];
  if (!spec || !code.trim()) return null;

  if (spec === "sql") {
    const { format } = await import("sql-formatter");
    return format(code, { language: "sql", tabWidth: 2, keywordCase: "upper" });
  }
  if (spec === "json") {
    try {
      return JSON.stringify(JSON.parse(code), null, 2); // nhanh, không cần tải Prettier
    } catch {
      /* JSON có comment/trailing comma -> thử Prettier */
    }
  }
  const prettier = await import("prettier/standalone");
  const cfg = spec === "json" ? { parser: "json", plugins: ["babel", "estree"] } : spec;
  const plugins = await Promise.all(cfg.plugins.map((p) => pluginLoaders[p]()));
  const out = await prettier.format(code, {
    parser: cfg.parser,
    plugins: plugins as never[],
    printWidth: 80,
    tabWidth: 2,
    semi: true,
  });
  return out.replace(/\n+$/, "");
}

/** Làm đẹp 1 đoạn text: gộp khoảng trắng thừa, bỏ khoảng trắng trước dấu câu. */
export function cleanText(s: string) {
  return s
    .replace(/[ \t ]{2,}/g, " ")
    .replace(/[ \t]+([,.;:!?])/g, "$1");
}

type Inline = { type: string; text?: string; content?: Inline[]; [k: string]: unknown };
type Blk = { id: string; type: string; props?: Record<string, unknown>; content?: unknown; children?: Blk[] };

const TEXT_BLOCKS = new Set(["paragraph", "heading", "bulletListItem", "numberedListItem", "checkListItem", "toggleListItem", "quote"]);

/** Làm sạch mảng inline content; trả về mảng mới nếu có thay đổi, ngược lại null. */
function cleanInline(items: Inline[]): Inline[] | null {
  let changed = false;
  const out = items.map((it, i) => {
    if (it.type === "text" && typeof it.text === "string") {
      let t = cleanText(it.text);
      if (i === 0) t = t.trimStart();
      if (i === items.length - 1) t = t.trimEnd();
      if (t !== it.text) { changed = true; return { ...it, text: t }; }
    } else if (it.type === "link" && it.content) {
      const inner = cleanInline(it.content);
      if (inner) { changed = true; return { ...it, content: inner }; }
    }
    return it;
  });
  return changed ? out : null;
}

const isEmptyPara = (b: Blk) =>
  b.type === "paragraph" && (!Array.isArray(b.content) || (b.content as Inline[]).every((c) => !(c.text ?? "").trim())) && !b.children?.length;

/** Phần tối thiểu của BlockNoteEditor mà formatter cần. */
export interface FormatTarget {
  document: unknown[];
  updateBlock: (b: string, u: Record<string, unknown>) => unknown;
  removeBlocks: (ids: string[]) => unknown;
  focus: () => void;
}

export interface FormatResult { code: number; text: number; failed: string[]; skipped: number; empty: number }

/** Format toàn bộ document của editor (mode: text | code | all). */
export async function formatEditor(
  editor: FormatTarget,
  mode: "text" | "code" | "all" = "all"
): Promise<FormatResult> {
  const res: FormatResult = { code: 0, text: 0, failed: [], skipped: 0, empty: 0 };
  const doWalk = async (blocks: Blk[]) => {
    for (const b of blocks) {
      if (b.type === "codeBlock" && mode !== "text") {
        const lang = String(b.props?.language ?? "text");
        const src = (Array.isArray(b.content) ? (b.content as Inline[]) : []).map((c) => c.text ?? "").join("");
        if (!isFormattable(lang)) { if (src.trim()) res.skipped++; }
        else {
          try {
            const out = await formatCode(src, lang);
            if (out !== null && out !== src) { editor.updateBlock(b.id, { content: out }); res.code++; }
          } catch { res.failed.push(lang); }
        }
      } else if (TEXT_BLOCKS.has(b.type) && mode !== "code" && Array.isArray(b.content)) {
        const cleaned = cleanInline(b.content as Inline[]);
        if (cleaned) { editor.updateBlock(b.id, { content: cleaned }); res.text++; }
      }
      if (b.children?.length) await doWalk(b.children);
    }
  };
  await doWalk(editor.document as Blk[]);

  // Xoá dòng trống liên tiếp (giữ tối đa 1) và dòng trống ở cuối
  if (mode !== "code") {
    const top = editor.document as Blk[];
    const remove: string[] = [];
    top.forEach((b, i) => {
      if (isEmptyPara(b) && (i === 0 ? false : isEmptyPara(top[i - 1]))) remove.push(b.id);
    });
    if (top.length - remove.length > 1) {
      const last = [...top].reverse().find((b) => !remove.includes(b.id));
      if (last && isEmptyPara(last)) remove.push(last.id);
    }
    if (remove.length && remove.length < top.length) { editor.removeBlocks(remove); res.empty = remove.length; }
  }
  return res;
}

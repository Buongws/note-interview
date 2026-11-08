"use client";
import { memo, useEffect, useMemo } from "react";
import { useTheme } from "next-themes";
import { BlockNoteSchema, defaultBlockSpecs, createCodeBlockSpec } from "@blocknote/core";
import { vi } from "@blocknote/core/locales";
import { codeBlockOptions, syntaxHighlighter } from "@blocknote/code-block";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import type { FormatTarget } from "@/lib/format";

// Schema mặc định + code block có danh sách ngôn ngữ để highlight (shiki)
const schema = BlockNoteSchema.create({
  blockSpecs: { ...defaultBlockSpecs, codeBlock: createCodeBlockSpec(codeBlockOptions) },
});

interface Props {
  initialContent?: unknown[];
  /** Chỉ báo "có thay đổi" — KHÔNG đọc document ở đây (clone cả doc mỗi phím gõ rất tốn). */
  onChange: () => void;
  /** Trả về handle của editor để trang cha format / focus / đọc document khi cần. */
  onReady?: (editor: FormatTarget) => void;
}

/** Editor dạng block (heading, bullet, checklist, code, quote…). Gõ "/" để mở menu block. */
function BlockEditor({ initialContent, onChange, onReady }: Props) {
  const { resolvedTheme } = useTheme();
  const editor = useCreateBlockNote({
    schema,
    dictionary: vi,
    extensions: [syntaxHighlighter],
    // BlockNote không chấp nhận mảng rỗng
    initialContent: initialContent && initialContent.length ? (initialContent as never) : undefined,
  });

  useEffect(() => { onReady?.(editor as unknown as FormatTarget); }, [editor, onReady]);

  const theme = useMemo(() => (resolvedTheme === "dark" ? "dark" : "light"), [resolvedTheme]);

  return (
    <div className="note-editor -mx-3 sm:-mx-[54px]">
      <BlockNoteView
        editor={editor}
        theme={theme}
        onChange={onChange}
      />
    </div>
  );
}

// memo: gõ tiêu đề / tag không làm editor render lại
export default memo(BlockEditor);

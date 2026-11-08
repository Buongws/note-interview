"use client";
import { useMemo } from "react";
import { useTheme } from "next-themes";
import { BlockNoteSchema, defaultBlockSpecs, createCodeBlockSpec } from "@blocknote/core";
import { vi } from "@blocknote/core/locales";
import { codeBlockOptions, syntaxHighlighter } from "@blocknote/code-block";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

// Schema mặc định + code block có danh sách ngôn ngữ để highlight (shiki)
const schema = BlockNoteSchema.create({
  blockSpecs: { ...defaultBlockSpecs, codeBlock: createCodeBlockSpec(codeBlockOptions) },
});

interface Props {
  initialContent?: unknown[];
  onChange: (content: unknown[]) => void;
  placeholder?: string;
}

/** Editor dạng block (heading, bullet, checklist, code, quote…). Gõ "/" để mở menu block. */
export default function BlockEditor({ initialContent, onChange }: Props) {
  const { resolvedTheme } = useTheme();
  const editor = useCreateBlockNote({
    schema,
    dictionary: vi,
    extensions: [syntaxHighlighter],
    // BlockNote không chấp nhận mảng rỗng
    initialContent: initialContent && initialContent.length ? (initialContent as never) : undefined,
  });

  const theme = useMemo(() => (resolvedTheme === "dark" ? "dark" : "light"), [resolvedTheme]);

  return (
    <div className="note-editor -mx-3 sm:-mx-[54px]">
      <BlockNoteView
        editor={editor}
        theme={theme}
        // Chỉ đẩy tham chiếu doc lên; plain text được tính 1 lần khi autosave (không phải mỗi phím)
        onChange={() => onChange(editor.document as unknown[])}
      />
    </div>
  );
}

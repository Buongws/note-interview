"use client";
import { useState } from "react";
import { X } from "lucide-react";

/** Nhập tag: Enter hoặc dấu phẩy để thêm, Backspace khi ô trống để xoá tag cuối. */
export function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [text, setText] = useState("");

  function add() {
    const v = text.trim().replace(/^#/, "").toLowerCase();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setText("");
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs">
          #{t}
          <button type="button" aria-label={`Xoá tag ${t}`} onClick={() => onChange(tags.filter((x) => x !== t))} className="text-muted-foreground hover:text-foreground">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={add}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); }
          if (e.key === "Backspace" && !text && tags.length) onChange(tags.slice(0, -1));
        }}
        placeholder={tags.length ? "" : "Thêm tag…"}
        className="h-6 min-w-[5rem] flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}

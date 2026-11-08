"use client";
import { Braces, Code2, Sparkles, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export type FormatMode = "all" | "text" | "code";

/** Nút "Format" (Shift+Alt+F): làm đẹp text, format code (JS/TS/JSON/CSS/HTML/SQL/YAML/MD). */
export function FormatMenu({ onFormat, busy }: { onFormat: (m: FormatMode) => void; busy: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={busy} aria-label="Format">
          <Sparkles className={busy ? "h-3.5 w-3.5 animate-pulse" : "h-3.5 w-3.5"} />
          <span className="hidden sm:inline">Format</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60">
        <DropdownMenuItem onSelect={() => onFormat("all")}>
          <Sparkles className="h-4 w-4" /> Format tất cả
          <kbd className="ml-auto text-[10px] text-muted-foreground">⇧⌥F</kbd>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onFormat("text")}>
          <Type className="h-4 w-4" /> Làm đẹp văn bản
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onFormat("code")}>
          <Code2 className="h-4 w-4" /> Format code / JSON
        </DropdownMenuItem>
        <p className="flex items-start gap-1.5 px-2 pb-1.5 pt-2 text-[11px] leading-snug text-muted-foreground">
          <Braces className="mt-0.5 h-3 w-3 shrink-0" />
          Code block cần chọn đúng ngôn ngữ (JSON, JS, TS, CSS, HTML, SQL, YAML, Markdown).
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

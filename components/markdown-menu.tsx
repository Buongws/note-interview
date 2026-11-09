"use client";
import { useRef } from "react";
import { FileDown, FileText, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

/** Nút "Markdown": nhập file .md vào ghi chú hoặc xuất ghi chú ra .md. */
export function MarkdownMenu({ onImport, onExport }: { onImport: (file: File) => void; onExport: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={input} type="file" accept=".md,.markdown,.txt,text/markdown,text/plain" hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = ""; }}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" aria-label="Markdown">
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Markdown</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-52">
          <DropdownMenuItem onSelect={() => input.current?.click()}><FileUp className="h-4 w-4" /> Nhập file .md</DropdownMenuItem>
          <DropdownMenuItem onSelect={onExport}><FileDown className="h-4 w-4" /> Xuất ra .md</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

"use client";
import { createContext, useCallback, useContext, useRef, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}
type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const Ctx = createContext<ConfirmFn>(async () => false);

/** Hook: `const confirm = useConfirm(); if (await confirm({...})) ...` — thay cho window.confirm. */
export const useConfirm = () => useContext(Ctx);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((o) => {
    return new Promise<boolean>((resolve) => {
      resolver.current?.(false); // đóng modal cũ (nếu có)
      resolver.current = resolve;
      setOpts(o);
    });
  }, []);

  const close = (value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOpts(null);
  };

  return (
    <Ctx.Provider value={confirm}>
      {children}
      <Dialog open={!!opts} onOpenChange={(o) => !o && close(false)}>
        <DialogContent hideClose className="top-[20vh] max-w-sm" onOpenAutoFocus={(e) => e.preventDefault()}>
          <div className="flex gap-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${opts?.danger ? "bg-danger/10 text-danger" : "bg-amber-500/15 text-amber-600"}`}>
              <TriangleAlert className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold">{opts?.title}</DialogTitle>
              {opts?.description && <DialogDescription className="mt-1 text-sm text-muted-foreground">{opts.description}</DialogDescription>}
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => close(false)}>{opts?.cancelText ?? "Huỷ"}</Button>
            <Button autoFocus variant={opts?.danger ? "danger" : "default"} onClick={() => close(true)}>
              {opts?.confirmText ?? "Đồng ý"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Ctx.Provider>
  );
}

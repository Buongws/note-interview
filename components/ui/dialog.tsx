"use client";
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

export function DialogContent({
  className,
  children,
  hideClose,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { hideClose?: boolean }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="anim-overlay fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" />
      <DialogPrimitive.Content
        className={cn(
          "anim-dialog fixed left-1/2 top-[8vh] z-50 max-h-[calc(100dvh-4rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 overflow-y-auto rounded-xl border bg-card p-5 shadow-2xl focus:outline-none",
          className
        )}
        {...props}
      >
        {children}
        {!hideClose && (
          <DialogPrimitive.Close className="absolute right-3 top-3 rounded p-1 text-muted-foreground hover:bg-accent">
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

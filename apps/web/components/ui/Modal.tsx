"use client";

import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  tone?: "default" | "danger" | "success";
}

const toneClasses = {
  default: "border-white/70",
  danger: "border-rose-200",
  success: "border-emerald-200"
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  tone = "default"
}: ModalProps) {
  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className={cn("relative z-10 w-full max-w-2xl rounded-[28px] border bg-canvas p-6 shadow-panel", toneClasses[tone])}>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-500 hover:bg-white"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-5">
          <h2 className="text-2xl font-semibold text-ink">{title}</h2>
          {description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
        </div>

        <div>{children}</div>

        {footer ? <div className="mt-6 flex items-center justify-end gap-3">{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
}


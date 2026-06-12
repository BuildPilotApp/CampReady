"use client";

import { OverlayModal } from "@/components/ui/overlay-modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <OverlayModal title={title} onClose={onCancel}>
      <p className="mt-2 text-sm leading-relaxed text-muted">{message}</p>
      <div className="mt-5 flex flex-col gap-2">
        <button
          type="button"
          onClick={onConfirm}
          className="touch-target rounded-xl border-2 border-red-600/80 bg-red-950/40 px-4 py-3 text-base font-bold text-red-200 active:opacity-90"
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="touch-target rounded-xl border-2 border-border bg-background px-4 py-3 text-base font-bold text-foreground active:opacity-90"
        >
          {cancelLabel}
        </button>
      </div>
    </OverlayModal>
  );
}

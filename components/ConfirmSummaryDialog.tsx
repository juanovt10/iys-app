"use client";

import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

type SummaryField = {
  label: string;
  value: ReactNode;
  fullWidth?: boolean;
};

export default function ConfirmSummaryDialog({
  open,
  onOpenChange,
  title = "Confirmar",
  description,
  fields = [],
  children,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  confirmDisabled = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: ReactNode;
  fields?: SummaryField[];
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  confirmDisabled?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>

        {(fields?.length ?? 0) > 0 ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {fields.map((f, i) => (
              <div key={i} className={f.fullWidth ? "md:col-span-2" : undefined}>
                <div className="text-xs text-muted-foreground">{f.label}</div>
                <div className="font-medium break-words">{f.value}</div>
              </div>
            ))}
          </div>
        ) : null}

        {children ? (
          <>
            {(fields?.length ?? 0) > 0 ? <Separator /> : null}
            <div className="space-y-2">{children}</div>
          </>
        ) : null}

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button onClick={onConfirm} disabled={confirmDisabled}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



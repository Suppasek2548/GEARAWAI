"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Result = { ok: boolean; message: string };

/**
 * A button that (optionally) asks for confirmation and/or a text input, runs a Server Action,
 * shows the result as a toast and optionally navigates. Used for delete / toggle / status changes.
 */
export function ActionButton({
  label,
  run,
  confirm,
  input,
  variant = "outline",
  size = "sm",
  danger = false,
  redirectTo,
  className,
  ariaLabel,
}: {
  label: ReactNode;
  run: (text: string) => Promise<Result>;
  confirm?: { title: string; description?: ReactNode; confirmLabel?: string };
  input?: { label: string; required?: boolean; type?: "text" | "number" };
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md";
  danger?: boolean;
  redirectTo?: string;
  className?: string;
  ariaLabel?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const exec = () =>
    start(async () => {
      if (input?.required && !text.trim()) {
        setError(`กรุณากรอก${input.label}`);
        return;
      }
      const res = await run(text);
      if (res.ok) {
        toast.success(res.message);
        setOpen(false);
        setText("");
        setError(null);
        if (redirectTo) router.push(redirectTo);
      } else if (confirm || input) setError(res.message);
      else toast.error(res.message);
    });

  return (
    <>
      <Button
        size={size}
        variant={danger ? "ghost" : variant}
        className={danger ? `text-danger hover:text-danger ${className ?? ""}` : className}
        loading={pending && !open}
        aria-label={ariaLabel}
        onClick={() => (confirm || input ? setOpen(true) : exec())}
      >
        {label}
      </Button>
      {(confirm || input) && (
        <ConfirmDialog
          open={open}
          title={confirm?.title ?? "ยืนยัน"}
          danger={danger}
          confirmLabel={confirm?.confirmLabel ?? "ยืนยัน"}
          loading={pending}
          onCancel={() => {
            setOpen(false);
            setError(null);
          }}
          onConfirm={exec}
          description={
            <div className="flex flex-col gap-2">
              {confirm?.description && <div>{confirm.description}</div>}
              {input && (
                <>
                  <label htmlFor="action-input" className="text-sm text-ink-soft">
                    {input.label} {input.required && <span className="text-danger">*</span>}
                  </label>
                  <input
                    id="action-input"
                    type={input.type ?? "text"}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    maxLength={300}
                    className="h-11 rounded-btn border border-line bg-canvas px-3 text-ink"
                  />
                </>
              )}
              {error && (
                <p role="alert" className="text-sm text-danger">
                  {error}
                </p>
              )}
            </div>
          }
        />
      )}
    </>
  );
}

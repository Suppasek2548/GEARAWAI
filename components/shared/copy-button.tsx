"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

/** Clipboard API first; falls back to a hidden textarea for non-secure origins (e.g. a LAN IP on demo day). */
async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // permission denied or unavailable — try the fallback below
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

/**
 * "คัดลอก" button: copies `value`, shows "คัดลอกแล้ว" + check for ~2 s, then resets.
 * `label` names what is copied for screen readers (e.g. "เลขบัญชี").
 */
export function CopyButton({
  value,
  label,
  className,
}: {
  value: string;
  label: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = async () => {
    if (!(await writeClipboard(value))) {
      toast.error(`คัดลอก${label}ไม่สำเร็จ — กรุณาคัดลอกด้วยตนเอง`);
      return;
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? `คัดลอก${label}แล้ว` : `คัดลอก${label}`}
      className={cn(
        buttonClasses({ variant: "outline", size: "sm" }),
        "shrink-0 gap-1.5 whitespace-nowrap",
        copied && "border-success text-success hover:bg-success/10",
        className,
      )}
    >
      {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      <span aria-live="polite">{copied ? "คัดลอกแล้ว" : "คัดลอก"}</span>
    </button>
  );
}

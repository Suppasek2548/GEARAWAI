"use client";

import { useState, useTransition } from "react";
import { LogOut } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { logoutAction } from "@/lib/actions/auth";

/** Logout with a confirmation dialog (UI §11.2 / §15). */
export function LogoutButton({
  className,
  label = "ออกจากระบบ",
  labelClassName,
}: {
  className?: string;
  label?: string;
  labelClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        <LogOut className="size-4" aria-hidden />
        <span className={labelClassName}>{label}</span>
      </button>
      <ConfirmDialog
        open={open}
        title="ออกจากระบบ?"
        description="คุณต้องการออกจากระบบ GEARAWAI ใช่หรือไม่"
        confirmLabel="ออกจากระบบ"
        loading={pending}
        onCancel={() => setOpen(false)}
        onConfirm={() => startTransition(() => logoutAction())}
      />
    </>
  );
}

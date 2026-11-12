"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

const MESSAGES: Record<string, string> = {
  added: "เพิ่มที่อยู่เรียบร้อย",
  updated: "บันทึกการแก้ไขที่อยู่แล้ว",
};

/** Shows the success toast after a redirect from the add/edit form (?saved=…), then cleans the URL. */
export function AddressSavedToast({ saved }: { saved?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (!saved || !MESSAGES[saved]) return;
    // fixed id: React may run this effect twice (dev Strict Mode) — sonner then shows it only once
    toast.success(MESSAGES[saved], { id: "address-saved" });
    router.replace(pathname, { scroll: false });
  }, [saved, router, pathname]);
  return null;
}

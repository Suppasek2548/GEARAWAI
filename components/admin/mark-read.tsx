"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { markMessageReadIfNewAction } from "@/lib/actions/admin-content";

/** Opening a "new" message marks it as read (ADMIN §4.17). Runs once after the page is shown. */
export function MarkRead({ id, isNew }: { id: string; isNew: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!isNew) return;
    markMessageReadIfNewAction(id).then(() => router.refresh());
  }, [id, isNew, router]);
  return null;
}

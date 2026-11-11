"use client";

import { Printer } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className={buttonClasses({ size: "md" })}>
      <Printer className="size-4" aria-hidden /> พิมพ์ / บันทึกเป็น PDF
    </button>
  );
}

"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Building2, ImageUp, QrCode, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { submitPaymentAction } from "@/lib/actions/checkout";
import { formatTHB } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { DemoQr } from "./demo-qr";

type Method = "promptpay_demo" | "bank_transfer_demo";
const MAX_BYTES = 2 * 1024 * 1024; // bucket limit (upload_rule)
const MIME = ["image/jpeg", "image/png", "image/webp"];

/**
 * S09-F06–F08: choose method → QR / bank account → optional slip → submit_payment().
 * Demo mode shows the generated sample QR and "do not transfer" notes; live mode (D-22, Settings → Payment)
 * shows the store's uploaded QR and real account without Demo wording. Either way an admin checks the slip.
 * The slip goes to the PRIVATE bucket payment-slips at {user_id}/{order_id}/{uuid}.ext (storage policy + RPC check).
 * Method values stay `*_demo` — they are the database enum, not shown to customers.
 */
export function PaymentForm({
  orderId,
  orderNumber,
  userId,
  total,
  bank,
  live = false,
  qrImageUrl = null,
}: {
  orderId: string;
  orderNumber: string;
  userId: string;
  total: number;
  bank: { bank: string; account_name: string; account_no: string };
  live?: boolean;
  qrImageUrl?: string | null;
}) {
  const router = useRouter();
  const [method, setMethod] = useState<Method>("promptpay_demo");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const pickFile = (f: File | null) => {
    setFileError(null);
    if (!f) return setFile(null);
    if (!MIME.includes(f.type)) return setFileError("รองรับเฉพาะไฟล์ JPG, PNG หรือ WebP");
    if (f.size > MAX_BYTES) return setFileError("ไฟล์ต้องมีขนาดไม่เกิน 2 MB");
    setFile(f);
  };

  const submit = () =>
    start(async () => {
      let slipPath: string | null = null;
      if (file) {
        const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
        const path = `${userId}/${orderId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await createClient().storage.from("payment-slips").upload(path, file, {
          contentType: file.type,
          upsert: false,
        });
        if (error) {
          toast.error("อัปโหลดสลิปไม่สำเร็จ กรุณาลองใหม่ หรือส่งโดยไม่แนบสลิป");
          return;
        }
        slipPath = path;
      }
      const res = await submitPaymentAction({ orderId, method, slipPath, note });
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      router.push(`/checkout/success/${orderNumber}`);
    });

  const methods: { value: Method; label: string; icon: typeof QrCode }[] = [
    { value: "promptpay_demo", label: live ? "PromptPay" : "PromptPay (Demo)", icon: QrCode },
    { value: "bank_transfer_demo", label: live ? "โอนผ่านธนาคาร" : "โอนผ่านธนาคาร (Demo)", icon: Building2 },
  ];

  return (
    <div className="flex flex-col gap-6">
      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="mb-3 font-display text-lg font-semibold">เลือกช่องทางชำระเงิน</legend>
        {methods.map(({ value, label, icon: Icon }) => (
          <label
            key={value}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-card border p-4 transition-colors",
              method === value
                ? "border-brand-lime bg-brand-lime/5"
                : "border-line hover:border-brand-accent",
            )}
          >
            <input
              type="radio"
              name="method"
              value={value}
              checked={method === value}
              onChange={() => setMethod(value)}
              className="size-[18px] accent-brand-lime"
            />
            <span className="flex size-12 items-center justify-center rounded-btn bg-elevated">
              <Icon className="size-6 text-brand-accent" aria-hidden />
            </span>
            <span className="font-semibold">{label}</span>
          </label>
        ))}
      </fieldset>

      <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-warning/50 bg-canvas p-6 text-center">
        <p className="text-sm text-ink-soft">ยอดที่ต้องชำระ</p>
        <p className="font-display text-3xl font-bold text-brand-lime">{formatTHB(total)}</p>
        {method === "promptpay_demo" ? (
          qrImageUrl ? (
            <>
              {/* Store's own QR from Settings → Payment (Admin label: empty = generated sample QR) */}
              <Image
                src={qrImageUrl}
                alt="QR สำหรับชำระเงิน"
                width={250}
                height={250}
                className="size-[250px] max-w-full rounded-btn bg-white object-contain"
              />
              <p className={cn("text-sm", live ? "text-ink-soft" : "text-warning")}>
                {live
                  ? "สแกน QR เพื่อชำระเงิน แล้วแนบสลิปด้านล่างเพื่อให้ร้านตรวจสอบ"
                  : "QR สำหรับการสาธิต — ระบบชำระเงินจำลอง"}
              </p>
            </>
          ) : live ? (
            <p className="text-sm text-warning">ร้านยังไม่ได้ตั้งค่า QR — กรุณาเลือก &quot;โอนผ่านธนาคาร&quot;</p>
          ) : (
            <>
              <DemoQr seed={orderNumber} />
              <p className="text-sm text-warning">QR ตัวอย่างสำหรับการสาธิตเท่านั้น — สแกนชำระเงินจริงไม่ได้</p>
            </>
          )
        ) : (
          <dl className="grid w-full max-w-sm grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-left text-sm">
            <dt className="text-ink-soft">ธนาคาร</dt>
            <dd>{bank.bank}</dd>
            <dt className="text-ink-soft">ชื่อบัญชี</dt>
            <dd>{bank.account_name}</dd>
            <dt className="text-ink-soft">เลขที่บัญชี</dt>
            <dd className="font-mono">{bank.account_no}</dd>
            {live ? (
              <dd className="col-span-2 mt-1 text-ink-soft">โอนแล้วกรุณาแนบสลิปด้านล่างเพื่อให้ร้านตรวจสอบ</dd>
            ) : (
              <dd className="col-span-2 mt-1 text-warning">ข้อมูลบัญชีตัวอย่าง — ห้ามโอนเงินจริง</dd>
            )}
          </dl>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-ink-soft">แนบสลิป (ไม่บังคับ)</span>
        {file ? (
          <div className="flex items-center gap-3 rounded-btn border border-line bg-surface p-3 text-sm">
            <ImageUp className="size-5 text-brand-accent" aria-hidden />
            <span className="flex-1 truncate">{file.name}</span>
            <span className="text-ink-muted">{(file.size / 1024).toFixed(0)} KB</span>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              aria-label="นำไฟล์ออก"
              className="inline-flex size-9 cursor-pointer items-center justify-center rounded-btn hover:bg-elevated"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ) : (
          <label className="flex h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-card border border-dashed border-line text-sm text-ink-soft hover:border-brand-accent">
            <ImageUp className="size-6" aria-hidden />
            เลือกไฟล์ JPG / PNG / WebP (ไม่เกิน 2 MB)
            <input
              ref={inputRef}
              type="file"
              accept={MIME.join(",")}
              className="sr-only"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
          </label>
        )}
        {fileError && (
          <p role="alert" className="text-sm text-danger">
            {fileError}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="payer-note" className="text-sm font-medium text-ink-soft">
          หมายเหตุถึงผู้ดูแล (ไม่บังคับ)
        </label>
        <input
          id="payer-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={300}
          className="h-12 rounded-btn border border-line bg-canvas px-4 text-ink"
        />
      </div>

      <Button size="lg" onClick={submit} loading={pending} className="w-full">
        {live ? "ยืนยันการแจ้งชำระ" : "ยืนยันการแจ้งชำระ (Demo)"}
      </Button>
    </div>
  );
}

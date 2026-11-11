"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";
import { ImagePlus, Library, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { listMediaAction } from "@/lib/actions/admin-media";
import type { MediaCategory, MediaItem } from "@/lib/admin/media-types";
import { uploadImage, RECOMMENDED, UPLOAD_MIME } from "@/lib/admin/upload";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

/**
 * ImagePicker (ADMIN §3): pick from the Image Library or upload a new file.
 * Keeps the chosen public URL in a hidden input called `name`, so it works inside any <form>.
 */
export function ImagePicker({
  name,
  category,
  defaultUrl,
  label,
  onPicked,
}: {
  name: string;
  category: MediaCategory;
  defaultUrl?: string | null;
  label?: string;
  onPicked?: (item: { url: string; mediaId: string | null }) => void;
}) {
  const [url, setUrl] = useState(defaultUrl ?? "");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [loading, startLoad] = useTransition();
  const [uploading, startUpload] = useTransition();
  const dlg = useRef<HTMLDialogElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const rec = RECOMMENDED[category];

  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const openLibrary = () => {
    setOpen(true);
    startLoad(async () => setItems(await listMediaAction(category)));
  };

  const choose = (u: string, mediaId: string | null) => {
    setUrl(u);
    onPicked?.({ url: u, mediaId });
    setOpen(false);
  };

  const upload = (file: File) =>
    startUpload(async () => {
      const res = await uploadImage(file, category);
      if (!res.ok) return void toast.error(res.message);
      if (res.warning) toast.warning(res.warning);
      else toast.success("อัปโหลดแล้ว");
      choose(res.item.url, res.item.id);
    });

  return (
    <div className="flex flex-col gap-2">
      {label && <span className="text-sm font-medium text-ink-soft">{label}</span>}
      <input type="hidden" name={name} value={url} />
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex size-24 items-center justify-center overflow-hidden rounded-btn border border-line bg-canvas">
          {url ? (
            <Image
              src={url}
              alt=""
              fill
              sizes="96px"
              className="object-contain"
              unoptimized={url.endsWith(".svg")}
            />
          ) : (
            <ImagePlus className="size-8 text-ink-muted" aria-hidden />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={openLibrary}>
            <Library className="size-4" aria-hidden /> เลือกจากคลัง
          </Button>
          <Button size="sm" variant="outline" loading={uploading} onClick={() => fileRef.current?.click()}>
            {!uploading && <Upload className="size-4" aria-hidden />} อัปโหลด
          </Button>
          {url && onPicked === undefined && (
            <Button size="sm" variant="ghost" onClick={() => setUrl("")} aria-label="นำภาพออก">
              <X className="size-4" aria-hidden />
            </Button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept={UPLOAD_MIME.join(",")}
          className="sr-only"
          tabIndex={-1}
          aria-label="เลือกไฟล์ภาพ"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) upload(f);
          }}
        />
      </div>
      <p className="text-xs text-ink-muted">
        JPG / PNG / WebP ไม่เกิน 2 MB{rec ? ` · แนะนำ ${rec[0]}×${rec[1]} px` : ""}
      </p>

      <dialog
        ref={dlg}
        aria-label="คลังรูปภาพ"
        onCancel={(e) => {
          e.preventDefault();
          setOpen(false);
        }}
        onClick={(e) => e.target === dlg.current && setOpen(false)}
        className="m-auto w-[calc(100%-2rem)] max-w-3xl rounded-card border border-line bg-surface p-0 text-ink backdrop:bg-canvas/80"
      >
        <div className="flex items-center justify-between border-b border-line p-4">
          <h2 className="font-display text-lg font-semibold">เลือกภาพ ({category})</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="ปิด"
            className="inline-flex size-10 cursor-pointer items-center justify-center rounded-btn hover:bg-elevated"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {loading || items === null ? (
            <p className="flex items-center gap-2 text-ink-soft">
              <Loader2 className="size-4 animate-spin" aria-hidden /> กำลังโหลด…
            </p>
          ) : items.length === 0 ? (
            <p className="text-ink-soft">ยังไม่มีภาพในหมวดนี้ — กด “อัปโหลด” เพื่อเพิ่มภาพ</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {items.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => choose(m.url, m.id)}
                    className={cn(
                      "flex w-full cursor-pointer flex-col gap-1 rounded-btn border p-2 text-left text-xs hover:border-brand-lime",
                      m.url === url ? "border-brand-lime" : "border-line",
                    )}
                  >
                    <span className="relative block aspect-square w-full overflow-hidden rounded bg-canvas">
                      <Image src={m.url} alt={m.alt ?? ""} fill sizes="160px" className="object-contain" />
                    </span>
                    <span className="truncate">{m.fileName}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </dialog>
    </div>
  );
}

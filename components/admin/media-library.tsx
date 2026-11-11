"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Pencil, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { deleteMediaAction, updateMediaAction } from "@/lib/actions/admin-media";
import { MEDIA_CATEGORIES, type MediaCategory, type MediaItem } from "@/lib/admin/media-types";
import { uploadImage, RECOMMENDED, UPLOAD_MIME } from "@/lib/admin/upload";
import { formatThaiDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

/** S16 Image Management: drag & drop upload box (500×300), grid of 160×160 previews, edit, safe delete. */
export function MediaLibrary({
  items,
  defaultCategory,
}: {
  items: MediaItem[];
  defaultCategory: MediaCategory;
}) {
  const router = useRouter();
  const [category, setCategory] = useState<MediaCategory>(defaultCategory);
  const [drag, setDrag] = useState(false);
  const [uploading, startUpload] = useTransition();
  const [editing, setEditing] = useState<MediaItem | null>(null);
  const [deleting, setDeleting] = useState<MediaItem | null>(null);
  const [editAlt, setEditAlt] = useState("");
  const [editCat, setEditCat] = useState<MediaCategory>("other");
  const [busy, startBusy] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const uploadMany = (files: FileList | File[]) =>
    startUpload(async () => {
      let ok = 0;
      for (const f of Array.from(files)) {
        const res = await uploadImage(f, category);
        if (!res.ok) toast.error(`${f.name}: ${res.message}`);
        else {
          ok++;
          if (res.warning) toast.warning(`${f.name}: ${res.warning}`);
        }
      }
      if (ok) toast.success(`อัปโหลด ${ok} ไฟล์แล้ว`);
      router.refresh();
    });

  const rec = RECOMMENDED[category];

  return (
    <div className="flex flex-col gap-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (e.dataTransfer.files.length) uploadMany(e.dataTransfer.files);
        }}
        className={cn(
          "flex w-full max-w-[500px] flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed p-6 text-center",
          "min-h-[220px] md:min-h-[300px]",
          drag ? "border-brand-lime bg-brand-lime/5" : "border-line",
        )}
      >
        <UploadCloud className="size-10 text-brand-accent" aria-hidden />
        <p className="text-sm text-ink-soft">ลากไฟล์มาวางที่นี่ หรือ</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <label htmlFor="upload-category" className="text-sm">
            หมวดภาพ
          </label>
          <select
            id="upload-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as MediaCategory)}
            className="h-10 rounded-btn border border-line bg-canvas px-2 text-sm text-ink"
          >
            {MEDIA_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <label
            className={cn(
              "inline-flex h-10 cursor-pointer items-center rounded-btn bg-brand-lime px-4 text-sm font-semibold text-canvas",
              uploading && "pointer-events-none opacity-60",
            )}
          >
            {uploading ? "กำลังอัปโหลด…" : "เลือกไฟล์"}
            <input
              type="file"
              multiple
              accept={UPLOAD_MIME.join(",")}
              className="sr-only"
              onChange={(e) => {
                if (e.target.files?.length) uploadMany(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        <p className="text-xs text-ink-muted">
          JPG / PNG / WebP ไม่เกิน 2 MB{rec ? ` · ขนาดแนะนำ ${rec[0]}×${rec[1]} px` : ""}
        </p>
      </div>

      {items.length === 0 ? (
        <p className="text-ink-soft">ยังไม่มีภาพ</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {items.map((m) => (
            <li
              key={m.id}
              className="flex flex-col gap-2 rounded-card border border-line bg-surface p-2 text-xs"
            >
              <div className="relative mx-auto size-40 max-w-full overflow-hidden rounded-btn bg-canvas">
                <Image src={m.url} alt={m.alt ?? m.fileName} fill sizes="160px" className="object-contain" />
              </div>
              <p className="truncate font-semibold" title={m.fileName}>
                {m.fileName}
              </p>
              <p className="text-ink-muted">
                {m.category} · {(m.sizeBytes / 1024).toFixed(0)} KB
                {m.width ? ` · ${m.width}×${m.height}` : ""}
              </p>
              <p className="text-ink-muted">{formatThaiDate(m.createdAt)}</p>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`คัดลอก URL ${m.fileName}`}
                  onClick={async () => {
                    await navigator.clipboard.writeText(m.url).catch(() => null);
                    toast.success("คัดลอก URL แล้ว");
                  }}
                >
                  <Copy className="size-4" aria-hidden />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`แก้ไข ${m.fileName}`}
                  onClick={() => {
                    setEditing(m);
                    setEditAlt(m.alt ?? "");
                    setEditCat(m.category);
                  }}
                >
                  <Pencil className="size-4" aria-hidden />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-danger hover:text-danger"
                  aria-label={`ลบ ${m.fileName}`}
                  onClick={() => {
                    setDeleting(m);
                    setDeleteError(null);
                  }}
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={editing !== null}
        title="แก้ไขข้อมูลภาพ"
        confirmLabel="บันทึก"
        loading={busy}
        onCancel={() => setEditing(null)}
        onConfirm={() =>
          startBusy(async () => {
            if (!editing) return;
            const res = await updateMediaAction(editing.id, editAlt, editCat);
            if (res.ok) {
              toast.success(res.message);
              setEditing(null);
              router.refresh();
            } else toast.error(res.message);
          })
        }
        description={
          <div className="flex flex-col gap-2">
            <label htmlFor="edit-alt" className="text-sm text-ink-soft">
              Alt Text (คำอธิบายภาพ)
            </label>
            <input
              id="edit-alt"
              value={editAlt}
              onChange={(e) => setEditAlt(e.target.value)}
              maxLength={200}
              className="h-11 rounded-btn border border-line bg-canvas px-3 text-ink"
            />
            <label htmlFor="edit-cat" className="text-sm text-ink-soft">
              หมวดภาพ
            </label>
            <select
              id="edit-cat"
              value={editCat}
              onChange={(e) => setEditCat(e.target.value as MediaCategory)}
              className="h-11 rounded-btn border border-line bg-canvas px-2 text-ink"
            >
              {MEDIA_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <p className="text-xs text-ink-muted">ต้องการเปลี่ยนไฟล์: อัปโหลดภาพใหม่ แล้วเลือกใช้แทนในฟอร์มที่เกี่ยวข้อง</p>
          </div>
        }
      />
      <ConfirmDialog
        open={deleting !== null}
        title={`ลบภาพ ${deleting?.fileName ?? ""}?`}
        danger
        confirmLabel="ลบภาพ"
        loading={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={() =>
          startBusy(async () => {
            if (!deleting) return;
            const res = await deleteMediaAction(deleting.id);
            if (res.ok) {
              toast.success(res.message);
              setDeleting(null);
              router.refresh();
            } else setDeleteError(res.message);
          })
        }
        description={
          <div className="flex flex-col gap-2">
            <p>ระบบจะตรวจว่าภาพยังถูกใช้งานอยู่หรือไม่ก่อนลบ (ลบแล้วกู้คืนไม่ได้)</p>
            {deleteError && (
              <p role="alert" className="text-sm text-danger">
                {deleteError}
              </p>
            )}
          </div>
        }
      />
    </div>
  );
}

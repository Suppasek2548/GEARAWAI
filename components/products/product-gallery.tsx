"use client";

import { useEffect, useRef, useState } from "react";
import { X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ProductImage } from "./product-image";

/** Main image + thumbnails, click to open a zoom view (UI §7.2). */
export function ProductGallery({ images, name }: { images: { url: string; alt: string }[]; name: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);
  const current = images[active] ?? null;

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (zoom && !d.open) d.showModal();
    if (!zoom && d.open) d.close();
  }, [zoom]);

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => current && setZoom(true)}
        className="group relative cursor-zoom-in overflow-hidden rounded-card border border-line bg-surface p-6"
        aria-label={`ขยายภาพ ${name}`}
      >
        <ProductImage
          src={current?.url ?? null}
          alt={current?.alt ?? name}
          sizes="(min-width: 1024px) 520px, 100vw"
          priority
          className="mx-auto aspect-square w-full max-w-[520px]"
        />
        <ZoomIn
          className="absolute right-3 bottom-3 size-5 text-ink-muted group-hover:text-ink"
          aria-hidden
        />
      </button>

      {images.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1" aria-label="ภาพสินค้า">
          {images.map((img, i) => (
            <li key={img.url + i}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`ภาพที่ ${i + 1}`}
                aria-current={i === active}
                className={cn(
                  "size-20 cursor-pointer overflow-hidden rounded-btn border bg-surface p-1",
                  i === active ? "border-brand-lime" : "border-line hover:border-brand-accent",
                )}
              >
                <ProductImage src={img.url} alt="" sizes="80px" className="size-full" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <dialog
        ref={ref}
        aria-label={`ภาพขยาย ${name}`}
        onCancel={(e) => {
          e.preventDefault();
          setZoom(false);
        }}
        onClick={(e) => e.target === ref.current && setZoom(false)}
        className="m-auto w-[calc(100%-2rem)] max-w-3xl rounded-card border border-line bg-surface p-4 backdrop:bg-canvas/90"
      >
        <button
          type="button"
          onClick={() => setZoom(false)}
          aria-label="ปิดภาพขยาย"
          className="absolute top-2 right-2 z-10 inline-flex size-11 cursor-pointer items-center justify-center rounded-btn bg-canvas/70 text-ink hover:bg-elevated"
        >
          <X className="size-5" aria-hidden />
        </button>
        {zoom && current && (
          <ProductImage src={current.url} alt={current.alt} sizes="768px" className="aspect-square w-full" />
        )}
      </dialog>
    </div>
  );
}

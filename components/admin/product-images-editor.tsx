"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { addProductImageAction, productImageAction } from "@/lib/actions/admin-catalog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/misc";
import { ProductImage } from "@/components/products/product-image";
import { ImagePicker } from "./image-picker";

type Img = { id: string; image_url: string; is_primary: boolean; sort_order: number };

/** ADMIN §4.2 images: several pictures, choose the primary one, reorder, remove (S16-F07). */
export function ProductImagesEditor({
  productId,
  productName,
  images,
}: {
  productId: string;
  productName: string;
  images: Img[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; message: string }>) =>
    start(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(res.message);
        router.refresh();
      } else toast.error(res.message);
    });

  return (
    <section
      id="images"
      aria-labelledby="img-heading"
      className="flex scroll-mt-24 flex-col gap-4 rounded-card border border-line bg-surface p-5 md:p-6"
    >
      <h2 id="img-heading" className="font-display text-lg font-semibold">
        รูปภาพสินค้า ({images.length})
      </h2>
      {images.length === 0 && (
        <p className="text-sm text-warning">ยังไม่มีรูป — แนะนำให้มีอย่างน้อย 1 รูปก่อนเปิดขาย (800×800)</p>
      )}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {images.map((img, i) => (
          <li key={img.id} className="flex flex-col gap-2 rounded-btn border border-line p-2">
            <ProductImage
              src={img.image_url}
              alt=""
              sizes="160px"
              className="aspect-square w-full rounded bg-canvas"
            />
            {img.is_primary ? <Badge tone="sale">ภาพหลัก</Badge> : null}
            <div className="flex flex-wrap gap-1">
              {!img.is_primary && (
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={pending}
                  aria-label="ตั้งเป็นภาพหลัก"
                  onClick={() => run(() => productImageAction(img.id, "primary"))}
                >
                  <Star className="size-4" aria-hidden />
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                disabled={pending || i === 0}
                aria-label="เลื่อนขึ้น"
                onClick={() => run(() => productImageAction(img.id, "up"))}
              >
                <ArrowUp className="size-4" aria-hidden />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                disabled={pending || i === images.length - 1}
                aria-label="เลื่อนลง"
                onClick={() => run(() => productImageAction(img.id, "down"))}
              >
                <ArrowDown className="size-4" aria-hidden />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-danger hover:text-danger"
                disabled={pending}
                aria-label="ลบรูป"
                onClick={() => run(() => productImageAction(img.id, "remove"))}
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <ImagePicker
        key={images.length}
        name="__new_product_image"
        category="product"
        label="เพิ่มรูป"
        onPicked={({ url, mediaId }) =>
          run(() => addProductImageAction(productId, url, mediaId, productName))
        }
      />
    </section>
  );
}

import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Product image with object-fit: contain (SPEC system 3). Source images are 800×800.
 * Local SVG placeholders are served as-is; Storage images go through next/image optimisation.
 */
export function ProductImage({
  src,
  alt,
  sizes,
  priority = false,
  className,
}: {
  src: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  if (!src) {
    return (
      <div className={cn("flex items-center justify-center bg-elevated text-ink-muted", className)}>
        <ImageOff className="size-10" aria-hidden />
        <span className="sr-only">{alt}</span>
      </div>
    );
  }
  return (
    <div className={cn("relative", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={src.endsWith(".svg")}
        className="object-contain"
      />
    </div>
  );
}

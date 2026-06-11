import type { ReactNode } from "react";
import { SafeImage } from "./SafeImage";

interface ImageGridItem {
  id: string;
  url: string;
  alt: string;
  label?: string;
  meta?: string;
  overlay?: ReactNode;
}

interface ImageGridProps {
  items: ImageGridItem[];
  square?: boolean;
  columns?: "auto" | "nine";
}

export function ImageGrid({ items, square = false, columns = "auto" }: ImageGridProps) {
  const gridClass = columns === "nine" ? "grid-cols-3" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
  return (
    <div className={`grid gap-3 ${gridClass}`}>
      {items.map((item) => (
        <figure key={item.id} className="group relative overflow-hidden rounded-2xl border border-white/70 bg-white/80 shadow-sm">
          <SafeImage
            src={item.url}
            alt={item.alt}
            className={`${square ? "aspect-square" : "aspect-[4/3]"} w-full object-cover transition duration-300 group-hover:scale-105`}
          />
          {(item.label || item.meta) && (
            <figcaption className="space-y-0.5 px-3 py-2">
              {item.label && <div className="truncate text-sm font-bold text-slate-800">{item.label}</div>}
              {item.meta && <div className="truncate text-xs text-slate-500">{item.meta}</div>}
            </figcaption>
          )}
          {item.overlay}
        </figure>
      ))}
    </div>
  );
}

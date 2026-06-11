import { ImagePlus, Star } from "lucide-react";
import { useMemo, useState } from "react";
import type { GridRecommendation, ImageAnalysis } from "../types";
import { SafeImage } from "./SafeImage";
import { StatusBadge } from "./StatusBadge";

interface AssetPanelProps {
  analyses: ImageAnalysis[];
  grid: GridRecommendation[];
  onAddToGrid: (image: ImageAnalysis) => void;
  onSetCover: (image: ImageAnalysis) => void;
}

export function AssetPanel({ analyses, grid, onAddToGrid, onSetCover }: AssetPanelProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"quality" | "original">("quality");
  const gridIds = new Set(grid.map((item) => item.image_id));
  const filtered = useMemo(() => {
    const lower = query.trim().toLowerCase();
    const items = analyses.filter((image) => {
      if (!lower) return true;
      return [image.scene, image.emotion, image.suggested_use, image.visual_focus].join(" ").toLowerCase().includes(lower);
    });
    return sort === "quality" ? [...items].sort((a, b) => b.quality - a.quality) : items;
  }, [analyses, query, sort]);

  return (
    <div>
      <div className="mb-3 flex gap-2">
        <input
          className="focus-ring min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          placeholder="筛选场景 / 情绪 / 用途"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold" onClick={() => setSort(sort === "quality" ? "original" : "quality")}>
          {sort === "quality" ? "质量排序" : "原始顺序"}
        </button>
      </div>
      <div className="max-h-[720px] space-y-3 overflow-auto pr-1">
        {filtered.map((image, index) => {
          const inGrid = gridIds.has(image.id);
          return (
            <article key={image.id} className="rounded-2xl border border-white/70 bg-white/82 p-3 shadow-sm">
              <div className="flex gap-3">
                <SafeImage src={image.url} alt={image.filename} className="h-20 w-24 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-bold text-ink">素材 {index + 1}</div>
                    {inGrid && <StatusBadge label="已入九宫格" tone="green" />}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">{image.scene} · {image.emotion}</div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <StatusBadge label={`Q ${image.quality}`} tone="blue" />
                    <StatusBadge label={image.suggested_use} tone="violet" />
                  </div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700" onClick={() => onAddToGrid(image)} disabled={inGrid}>
                  <ImagePlus size={14} />
                  加入九宫格
                </button>
                <button className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700" onClick={() => onSetCover(image)}>
                  <Star size={14} />
                  设为封面
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

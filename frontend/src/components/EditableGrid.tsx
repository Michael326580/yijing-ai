import { GripVertical, Trash2 } from "lucide-react";
import type { GridRecommendation } from "../types";
import { SafeImage } from "./SafeImage";

interface EditableGridProps {
  grid: GridRecommendation[];
  onChange: (grid: GridRecommendation[]) => void;
}

export function EditableGrid({ grid, onChange }: EditableGridProps) {
  const reorder = (from: number, to: number) => {
    if (from === to) return;
    const next = [...grid];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(normalize(next));
  };

  const remove = (index: number) => {
    onChange(normalize(grid.filter((_, itemIndex) => itemIndex !== index)));
  };

  const updateUse = (index: number, suggestedUse: string) => {
    onChange(normalize(grid.map((item, itemIndex) => (itemIndex === index ? { ...item, suggested_use: suggestedUse } : item))));
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      {Array.from({ length: 9 }).map((_, index) => {
        const item = grid[index];
        return (
          <div
            key={item?.image_id ?? `empty-${index}`}
            className="min-h-40 rounded-2xl border border-white/70 bg-white/80 p-2 shadow-sm"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              const from = Number(event.dataTransfer.getData("text/grid-index"));
              if (!Number.isNaN(from)) reorder(from, index);
            }}
          >
            {!item ? (
              <div className="flex h-full min-h-36 items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm font-semibold text-slate-400">
                P{index + 1}
              </div>
            ) : (
              <div draggable onDragStart={(event) => event.dataTransfer.setData("text/grid-index", String(index))} className="group">
                <div className="relative overflow-hidden rounded-xl">
                  <SafeImage src={item.url} alt={item.position} className="aspect-square w-full object-cover" />
                  <div className="absolute left-2 top-2 rounded-lg bg-slate-950/70 px-2 py-1 text-xs font-bold text-white">{item.position}</div>
                  <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                    <button type="button" className="rounded-lg bg-white/90 p-1.5 text-slate-700" aria-label="拖拽排序">
                      <GripVertical size={14} />
                    </button>
                    <button type="button" className="rounded-lg bg-white/90 p-1.5 text-red-600" onClick={() => remove(index)} aria-label="移除">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <input
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700"
                  value={item.suggested_use}
                  onChange={(event) => updateUse(index, event.target.value)}
                />
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{item.reason}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function normalize(grid: GridRecommendation[]): GridRecommendation[] {
  return grid.slice(0, 9).map((item, index) => ({ ...item, position: `P${index + 1}` }));
}

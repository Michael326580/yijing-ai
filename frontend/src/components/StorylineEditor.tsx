import { WandSparkles } from "lucide-react";
import type { StorylineItem } from "../types";

interface StorylineEditorProps {
  storyline: StorylineItem[];
  onChange: (storyline: StorylineItem[]) => void;
  onRegenerate: (instruction: string) => Promise<void>;
  loading?: boolean;
}

export function StorylineEditor({ storyline, onChange, onRegenerate, loading }: StorylineEditorProps) {
  const update = (index: number, patch: Partial<StorylineItem>) => {
    onChange(storyline.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  };

  return (
    <div className="space-y-3">
      {storyline.map((item, index) => (
        <div key={item.step} className="rounded-2xl border border-slate-100 bg-white/80 p-3">
          <div className="mb-2 text-xs font-bold text-blue-700">{item.step}</div>
          <input className="focus-ring w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold" value={item.title} onChange={(event) => update(index, { title: event.target.value })} />
          <textarea className="focus-ring mt-2 min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm leading-6" value={item.description} onChange={(event) => update(index, { description: event.target.value })} />
        </div>
      ))}
      <button className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-bold text-violet-700" onClick={() => onRegenerate("")} disabled={loading}>
        <WandSparkles size={16} />
        {loading ? "重生成中" : "重生成故事线"}
      </button>
    </div>
  );
}

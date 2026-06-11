import { RotateCcw, WandSparkles } from "lucide-react";
import { useState } from "react";
import type { AlbumCaptions, CaptionKey } from "../types";
import { CopyButton } from "./CopyButton";

interface CaptionEditorProps {
  captions: AlbumCaptions;
  originalCaptions: AlbumCaptions;
  onChange: (captions: AlbumCaptions) => void;
  onRegenerate: (key: CaptionKey, instruction: string) => Promise<void>;
  loadingKey?: CaptionKey | null;
}

const labels: Record<CaptionKey, string> = {
  concise: "简洁",
  passionate: "热血",
  literary: "文艺",
  official: "官方",
};

export function CaptionEditor({ captions, originalCaptions, onChange, onRegenerate, loadingKey }: CaptionEditorProps) {
  const [active, setActive] = useState<CaptionKey>("literary");
  const [instruction, setInstruction] = useState("");

  const update = (value: string) => onChange({ ...captions, [active]: value });

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {(Object.keys(captions) as CaptionKey[]).map((key) => (
          <button key={key} type="button" className={`rounded-full border px-4 py-2 text-sm font-bold ${active === key ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700"}`} onClick={() => setActive(key)}>
            {labels[key]}
          </button>
        ))}
      </div>
      <textarea className="focus-ring min-h-36 w-full rounded-2xl border border-slate-200 bg-white p-4 leading-7 text-slate-800" value={captions[active]} onChange={(event) => update(event.target.value)} />
      <input className="focus-ring mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="局部重生成要求，例如：更适合公众号开头" value={instruction} onChange={(event) => setInstruction(event.target.value)} />
      <div className="mt-3 flex flex-wrap gap-2">
        <CopyButton text={captions[active]} label="复制当前文案" />
        <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700" onClick={() => update(originalCaptions[active])}>
          <RotateCcw size={16} />
          恢复 AI 原文
        </button>
        <button className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-bold text-violet-700" onClick={() => onRegenerate(active, instruction)} disabled={loadingKey === active}>
          <WandSparkles size={16} />
          {loadingKey === active ? "重生成中" : "局部重生成"}
        </button>
      </div>
    </div>
  );
}

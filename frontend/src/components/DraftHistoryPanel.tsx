import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { clearAlbumDrafts, deleteAlbumDraft, listAlbumDrafts } from "../lib/storage";
import type { AlbumDraft } from "../types";

interface DraftHistoryPanelProps {
  onRestore: (id: string) => void;
  limit?: number;
}

export function DraftHistoryPanel({ onRestore, limit }: DraftHistoryPanelProps) {
  const [drafts, setDrafts] = useState<AlbumDraft[]>([]);
  const refresh = () => setDrafts(listAlbumDrafts());
  const visibleDrafts = typeof limit === "number" ? drafts.slice(0, limit) : drafts;

  useEffect(() => {
    refresh();
  }, []);

  if (drafts.length === 0) {
    return <div className="rounded-2xl bg-slate-50 p-4 text-sm text-muted">暂无本地草稿。生成或保存相册后会出现在这里。</div>;
  }

  return (
    <div className="space-y-3">
      {visibleDrafts.map((draft) => (
        <div key={draft.id} className="rounded-2xl border border-slate-100 bg-white/85 p-3">
          <div className="font-bold text-ink">{draft.name}</div>
          <div className="mt-1 text-xs text-slate-500">{new Date(draft.updatedAt).toLocaleString()} · {draft.activityType}</div>
          <div className="mt-3 flex gap-2">
            <button className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700" onClick={() => onRestore(draft.id)}>
              恢复
            </button>
            <button
              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700"
              onClick={() => {
                deleteAlbumDraft(draft.id);
                refresh();
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
      <button
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600"
        onClick={() => {
          clearAlbumDrafts();
          refresh();
        }}
      >
        清空历史
      </button>
    </div>
  );
}

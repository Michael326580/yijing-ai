import type { LocalAlbumEvaluation } from "../lib/evaluation";

export function AlbumScorePanel({ evaluation }: { evaluation: LocalAlbumEvaluation }) {
  return (
    <div>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <div className="text-sm font-semibold text-muted">Album Score</div>
          <div className="text-4xl font-bold text-ink">{evaluation.score}</div>
        </div>
        <div className="text-sm font-bold text-blue-700">本地评分</div>
      </div>
      <div className="space-y-3">
        {Object.entries(evaluation.dimensions).map(([key, value]) => (
          <div key={key}>
            <div className="mb-1 flex justify-between text-xs font-semibold text-slate-500">
              <span>{dimensionLabels[key] ?? key}</span>
              <span>{value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500" style={{ width: `${value}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {evaluation.suggestions.map((suggestion) => (
          <div key={suggestion} className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold leading-5 text-blue-800">
            {suggestion}
          </div>
        ))}
      </div>
    </div>
  );
}

const dimensionLabels: Record<string, string> = {
  visualCoverage: "视觉覆盖",
  storylineCompleteness: "故事完整",
  emotionConsistency: "情绪一致",
  captionCompleteness: "文案完整",
  shareReadiness: "分享准备",
};

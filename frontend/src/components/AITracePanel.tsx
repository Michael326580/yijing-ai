import type { AIProviderStatus, AlbumGenerationPreferences } from "../types";
import { StatusBadge } from "./StatusBadge";

interface AITracePanelProps {
  providerStatus: AIProviderStatus | null;
  preferences: AlbumGenerationPreferences;
  analysesCount: number;
  gridCount: number;
  captionCount: number;
  generatedAt?: string;
  error?: string;
}

export function AITracePanel({ providerStatus, preferences, analysesCount, gridCount, captionCount, generatedAt, error }: AITracePanelProps) {
  const deepseek = providerStatus?.ai_provider === "deepseek" && providerStatus.deepseek_available;
  const providerLabel = providerStatus?.ai_provider === "mock" ? "本地兜底" : providerStatus?.ai_provider ?? "unknown";
  const fallbackLabel = providerStatus?.fallback === "mock" ? "本地兜底" : providerStatus?.fallback ?? "本地兜底";
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <StatusBadge label={deepseek ? "DeepSeek Ready" : "本地兜底已启用"} tone={deepseek ? "green" : "amber"} />
        <StatusBadge label={`Fallback: ${fallbackLabel}`} tone="slate" />
      </div>
      <TraceRow label="Provider" value={providerLabel} />
      <TraceRow label="Model" value={providerStatus?.deepseek_model ?? "本地稳定逻辑"} />
      <TraceRow label="生成偏好" value={`${preferences.visual_style} / ${preferences.output_scene} / ${preferences.emphasis}`} />
      <TraceRow label="参与图片" value={`${analysesCount} 张`} />
      <TraceRow label="九宫格图片" value={`${gridCount} 张`} />
      <TraceRow label="文案风格" value={`${captionCount} 种`} />
      <TraceRow label="最近生成" value={generatedAt ? new Date(generatedAt).toLocaleString() : "本地草稿"} />
      {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">失败提示：{error}</div>}
    </div>
  );
}

function TraceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-bold text-slate-800">{value}</span>
    </div>
  );
}

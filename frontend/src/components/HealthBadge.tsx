import { Activity, CheckCircle2, CloudOff, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { healthCheck } from "../lib/api";
import type { AIProviderStatus } from "../types";
import { StatusBadge } from "./StatusBadge";

export function HealthBadge() {
  const [status, setStatus] = useState<AIProviderStatus | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    healthCheck().then((payload) => {
      if (!cancelled) setStatus(payload);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const offline = status?.status === "offline";
  const isDeepSeek = status?.ai_provider === "deepseek" && status.deepseek_available;
  const label = offline ? "Backend Offline" : isDeepSeek ? "DeepSeek Ready" : "Local Fallback";
  const tone = offline ? "red" : isDeepSeek ? "green" : "amber";
  const Icon = offline ? CloudOff : isDeepSeek ? CheckCircle2 : Activity;

  return (
    <div className="relative hidden md:block">
      <button
        type="button"
        title="查看 AI 服务状态"
        className="flex items-center gap-2 rounded-full border border-white/70 bg-white/75 px-3 py-2 shadow-sm backdrop-blur transition hover:bg-white"
        onClick={() => setOpen((value) => !value)}
      >
        <Icon size={15} className={offline ? "text-red-600" : isDeepSeek ? "text-emerald-600" : "text-amber-600"} />
        <StatusBadge label={label} tone={tone} />
        <Info size={14} className="text-slate-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-30 w-80 rounded-2xl border border-white/70 bg-white p-4 text-sm shadow-soft">
          <div className="mb-3 font-bold text-ink">AI 服务状态</div>
          <Detail label="service" value={status?.service ?? "未知"} />
          <Detail label="ai_provider" value={formatProvider(status?.ai_provider)} />
          <Detail label="deepseek_model" value={status?.deepseek_model ?? "未启用"} />
          <Detail label="deepseek_available" value={status?.deepseek_available ? "true" : "false"} />
          <Detail label="fallback" value={formatProvider(status?.fallback)} />
          <Detail label="last_checked_at" value={status?.last_checked_at ? new Date(status.last_checked_at).toLocaleString() : "未知"} />
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-t border-slate-100 py-2">
      <span className="text-slate-400">{label}</span>
      <span className="max-w-44 truncate font-bold text-slate-700">{value}</span>
    </div>
  );
}

function formatProvider(value?: string | null): string {
  if (!value) return "本地兜底";
  if (value === "mock" || value === "local") return "本地兜底";
  if (value === "mock-ready") return "本地兜底可用";
  if (value === "offline") return "后端离线";
  return value;
}

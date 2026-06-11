import { ArrowRight, BarChart3, Crown, Filter, Loader2, RefreshCw, Sparkles, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { FlowStepper } from "../components/FlowStepper";
import { GlassCard } from "../components/GlassCard";
import { MetricCard } from "../components/MetricCard";
import { PageHeader } from "../components/PageHeader";
import { PrimaryButton } from "../components/PrimaryButton";
import { SafeImage } from "../components/SafeImage";
import { StatusBadge } from "../components/StatusBadge";
import { Toast } from "../components/Toast";
import { useAppState } from "../context/AppContext";
import { analyzeImages, healthCheck } from "../lib/api";
import {
  buildInsightSummary,
  calculateAverageQuality,
  getEmotionTags,
  getSceneTags,
  getTopImage,
  highestQuality,
  totalPeople,
} from "../lib/insights";
import type { AIProviderStatus, ImageAnalysis } from "../types";

type SortMode = "original" | "quality";

export function AnalysisPage() {
  const navigate = useNavigate();
  const { activityType, localImages, analyses, setAnalyses, setAlbum } = useAppState();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [health, setHealth] = useState<AIProviderStatus | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("original");
  const [highQualityOnly, setHighQualityOnly] = useState(false);
  const [emotionFilter, setEmotionFilter] = useState("全部");
  const [coverCandidateId, setCoverCandidateId] = useState<string | null>(null);

  useEffect(() => {
    healthCheck().then(setHealth);
  }, []);

  useEffect(() => {
    if (!loading) return;
    const timer = window.setInterval(() => {
      setProgress((value) => Math.min(value + 12, 92));
    }, 240);
    return () => window.clearInterval(timer);
  }, [loading]);

  const startAnalysis = async () => {
    if (localImages.length === 0) {
      setError("请先在上传页选择图片。");
      return;
    }

    setLoading(true);
    setProgress(8);
    setError("");
    try {
      const result = await analyzeImages(activityType, localImages.map((image) => image.file));
      setProgress(100);
      setAnalyses(result.analyses);
      setAlbum(null);
      setCoverCandidateId(result.analyses.find((image) => image.suggested_use === "封面主图")?.id ?? result.analyses[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI 分析失败。");
    } finally {
      window.setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 420);
    }
  };

  const emotionTags = useMemo(() => getEmotionTags(analyses), [analyses]);
  const sceneTags = useMemo(() => getSceneTags(analyses), [analyses]);
  const filteredAnalyses = useMemo(() => {
    let items = [...analyses];
    if (highQualityOnly) items = items.filter((image) => image.quality >= 85);
    if (emotionFilter !== "全部") items = items.filter((image) => image.emotion === emotionFilter);
    if (sortMode === "quality") items.sort((a, b) => b.quality - a.quality);
    return items;
  }, [analyses, highQualityOnly, emotionFilter, sortMode]);

  const topImage = getTopImage(analyses);
  const lowQualityImages = analyses.filter((image) => image.quality < 80);
  const recommendedUses = new Set(["封面主图", "场景图", "过程记录", "团队合影", "成果展示", "氛围花絮"]);
  const providerCopy =
    health?.ai_provider === "deepseek" && health.deepseek_available
      ? "当前已启用 DeepSeek，系统将结合图片分析结果生成相册叙事和文案。"
      : "当前使用本地兜底服务生成稳定结果，后端可切换 DeepSeek 增强。";
  const providerLabel = health?.ai_provider === "mock" ? "本地兜底" : health?.ai_provider ?? "unknown";
  const fallbackLabel = health?.fallback === "mock" ? "本地兜底" : health?.fallback ?? "本地兜底";

  return (
    <div>
      <Toast message={error} tone="error" onClose={() => setError("")} />
      <FlowStepper current="analysis" />
      <PageHeader
        eyebrow="Step 02 / AI Analysis Dashboard"
        title="AI 分析仪表盘"
        description="将素材转化为结构化影像数据：场景、情绪、人物数量、画面质量、视觉焦点和九宫格用途。"
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <GlassCard title="分析状态" description={providerCopy}>
          <div className="grid gap-3 sm:grid-cols-2">
            <StatusLine label="活动类型" value={activityType} />
            <StatusLine label="上传图片" value={`${localImages.length || analyses.length} 张`} />
            <StatusLine label="AI Provider" value={providerLabel} />
            <StatusLine label="Model" value={health?.deepseek_model ?? "本地稳定逻辑"} />
            <StatusLine label="DeepSeek" value={health?.deepseek_available ? "Ready" : "Not enabled"} />
            <StatusLine label="Fallback" value={fallbackLabel} />
          </div>
        </GlassCard>

        <GlassCard title="分析控制" description="先完成图片语义分析，再进入智能生成工作台。">
          <div className="flex flex-wrap gap-3">
            <PrimaryButton onClick={startAnalysis} disabled={loading || localImages.length === 0}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              开始 AI 分析
            </PrimaryButton>
            <PrimaryButton variant="secondary" disabled={analyses.length === 0} onClick={() => navigate("/generate")}>
              进入智能生成
              <ArrowRight size={18} />
            </PrimaryButton>
            <Link to="/upload">
              <PrimaryButton variant="ghost">
                <RefreshCw size={18} />
                返回上传
              </PrimaryButton>
            </Link>
          </div>
          {loading && (
            <div className="mt-5">
              <div className="mb-2 flex justify-between text-xs font-semibold text-muted">
                <span>理解图片语义 / 提取标签 / 生成结构化结果</span>
                <span>{progress}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-600 via-cyan-500 to-violet-600 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </GlassCard>
      </div>

      {analyses.length > 0 && (
        <>
          <section className="mb-6 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <MetricCard label="平均质量分" value={calculateAverageQuality(analyses)} icon={<BarChart3 size={18} />} />
            <MetricCard label="最高质量分" value={highestQuality(analyses)} />
            <MetricCard label="识别总人数" value={totalPeople(analyses)} icon={<Users size={18} />} />
            <MetricCard label="场景数量" value={sceneTags.length} />
            <MetricCard label="情绪标签" value={emotionTags.length} />
            <MetricCard label="封面候选" value={topImage?.suggested_use ?? "待选择"} icon={<Crown size={18} />} />
          </section>

          <GlassCard title="AI 洞察摘要" description="基于当前 analyses 字段在前端实时派生，不新增后端接口。" className="mb-6">
            <p className="text-base leading-8 text-slate-700">{buildInsightSummary(analyses)}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <StatusLine label="主要场景" value={sceneTags.slice(0, 2).join("、") || "待识别"} />
              <StatusLine label="主要情绪" value={emotionTags.slice(0, 2).join("、") || "待识别"} />
              <StatusLine label="推荐封面" value={topImage?.visual_focus ?? "待选择"} />
              <StatusLine label="推荐收束图" value={analyses[analyses.length - 1]?.suggested_use ?? "待选择"} />
            </div>
          </GlassCard>

          {lowQualityImages.length > 0 && (
            <GlassCard title="低质量风险提示" description="这些图片质量分偏低，建议作为花絮或补充素材，不建议作为封面。" className="mb-6">
              <div className="flex flex-wrap gap-2">
                {lowQualityImages.map((image) => (
                  <StatusBadge key={image.id} label={`${image.filename} · ${image.quality}`} tone="amber" />
                ))}
              </div>
            </GlassCard>
          )}

          <GlassCard title="筛选与排序" description="快速定位高质量画面和核心情绪标签。" className="mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <Filter size={18} className="text-blue-700" />
              <button
                type="button"
                onClick={() => setSortMode("original")}
                className={chipClass(sortMode === "original")}
              >
                原始顺序
              </button>
              <button type="button" onClick={() => setSortMode("quality")} className={chipClass(sortMode === "quality")}>
                按质量排序
              </button>
              <button type="button" onClick={() => setHighQualityOnly((value) => !value)} className={chipClass(highQualityOnly)}>
                只看高质量 ≥ 85
              </button>
              <select className="focus-ring rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700" value={emotionFilter} onChange={(event) => setEmotionFilter(event.target.value)}>
                <option value="全部">全部情绪</option>
                {emotionTags.map((emotion) => (
                  <option key={emotion} value={emotion}>
                    {emotion}
                  </option>
                ))}
              </select>
            </div>
          </GlassCard>
        </>
      )}

      {analyses.length === 0 ? (
        <EmptyState title="等待 AI 分析" description="上传素材后点击“开始 AI 分析”，这里会展示每张图片的结构化理解结果和全局统计。" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredAnalyses.map((image, index) => (
            <AnalysisCard
              key={image.id}
              image={image}
              displayIndex={analyses.findIndex((item) => item.id === image.id) + 1 || index + 1}
              selected={coverCandidateId === image.id}
              recommended={recommendedUses.has(image.suggested_use)}
              onSelect={() => setCoverCandidateId(image.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatusLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-slate-50/80 px-4 py-3">
      <div className="text-xs font-semibold text-slate-400">{label}</div>
      <div className="mt-1 truncate text-sm font-bold text-slate-800">{value}</div>
    </div>
  );
}

function AnalysisCard({
  image,
  displayIndex,
  selected,
  recommended,
  onSelect,
}: {
  image: ImageAnalysis;
  displayIndex: number;
  selected: boolean;
  recommended: boolean;
  onSelect: () => void;
}) {
  return (
    <article className={`grid gap-4 rounded-2xl border bg-white/82 p-4 shadow-sm backdrop-blur sm:grid-cols-[180px_1fr] ${selected ? "border-blue-300" : "border-white/70"}`}>
      <SafeImage src={image.url} alt={`照片 ${displayIndex}`} className="aspect-[4/3] w-full rounded-2xl object-cover" />
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <StatusBadge label={image.suggested_use} tone="blue" />
          <StatusBadge label={image.emotion} tone="violet" />
          {recommended && <StatusBadge label="推荐进入九宫格" tone="cyan" />}
          {selected && <StatusBadge label="封面候选" tone="green" />}
        </div>
        <h2 className="text-lg font-bold text-ink">照片 {displayIndex}</h2>
        <div className="mt-1 truncate text-xs text-slate-400">原始文件：{image.filename}</div>
        <p className="mt-2 text-sm leading-6 text-slate-700">{image.caption}</p>
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs font-semibold text-slate-500">
            <span>quality</span>
            <span>{image.quality}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500" style={{ width: `${image.quality}%` }} />
          </div>
        </div>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <Info label="scene" value={image.scene} />
          <Info label="people" value={`${image.people_count}`} />
          <Info label="focus" value={image.visual_focus} wide />
        </dl>
        {image.features && (
          <div className="mt-3 grid gap-2 sm:grid-cols-5">
            <FeaturePill label="亮度" value={image.features.brightness_score} />
            <FeaturePill label="清晰度" value={image.features.sharpness_score} />
            <FeaturePill label="色彩" value={image.features.colorfulness_score} />
            <FeaturePill label="构图" value={orientationLabel(image.features.orientation)} />
            <FeaturePill label="封面候选" value={image.features.cover_score} />
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {image.objects.map((object) => (
            <span key={object} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {object}
            </span>
          ))}
        </div>
        <button type="button" className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100" onClick={onSelect}>
          设为封面候选
        </button>
      </div>
    </article>
  );
}

function FeaturePill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-blue-50 px-2.5 py-2 text-center">
      <div className="text-[11px] font-semibold text-blue-500">{label}</div>
      <div className="mt-0.5 truncate text-xs font-black text-blue-800">{value}</div>
    </div>
  );
}

function orientationLabel(value: "landscape" | "portrait" | "square") {
  return { landscape: "横图", portrait: "竖图", square: "方图" }[value];
}

function Info({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <dt className="text-xs font-semibold uppercase text-slate-400">{label}</dt>
      <dd className="mt-0.5 font-medium text-slate-700">{value}</dd>
    </div>
  );
}

function chipClass(active: boolean) {
  return `rounded-full border px-3 py-2 text-sm font-semibold transition ${
    active ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
  }`;
}

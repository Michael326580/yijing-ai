import { ArrowLeft, Download, FileJson, FileText, Globe2, Grid3X3, Images, LayoutPanelTop, RefreshCw, Rows3, Activity } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CopyButton } from "../components/CopyButton";
import { DraftHistoryPanel } from "../components/DraftHistoryPanel";
import { EmptyState } from "../components/EmptyState";
import { FlowStepper } from "../components/FlowStepper";
import { GlassCard } from "../components/GlassCard";
import { AITracePanel } from "../components/AITracePanel";
import { MetricCard } from "../components/MetricCard";
import { PageHeader } from "../components/PageHeader";
import { PrimaryButton } from "../components/PrimaryButton";
import { SafeImage } from "../components/SafeImage";
import { StatusBadge } from "../components/StatusBadge";
import { Toast } from "../components/Toast";
import { useAppState } from "../context/AppContext";
import { calculateAlbumMetrics, totalPeople } from "../lib/insights";
import { evaluateAlbumLocally } from "../lib/evaluation";
import {
  buildHtmlAlbum,
  buildJsonReport,
  buildMarkdownReport,
  buildMomentsPackage,
  buildPresentationScript,
  buildProjectOnePager,
  captionLabels,
  downloadTextFile,
} from "../lib/report";
import type { CaptionKey } from "../types";

type ViewMode = "cover" | "grid" | "story" | "caption" | "report" | "trace";

const viewModes: Array<{ key: ViewMode; label: string; icon: typeof LayoutPanelTop }> = [
  { key: "cover", label: "封面模式", icon: LayoutPanelTop },
  { key: "grid", label: "九宫格模式", icon: Grid3X3 },
  { key: "story", label: "故事线模式", icon: Rows3 },
  { key: "caption", label: "文案模式", icon: FileText },
  { key: "report", label: "汇报模式", icon: Images },
  { key: "trace", label: "AI Trace", icon: Activity },
];

export function DemoPage() {
  const navigate = useNavigate();
  const { activityType, analyses, album, resetDemo, preferences, providerStatus, loadDemoProject, restoreDraft } = useAppState();
  const [viewMode, setViewMode] = useState<ViewMode>("cover");
  const [captionKey, setCaptionKey] = useState<CaptionKey>("literary");
  const [showGridLabels, setShowGridLabels] = useState(true);
  const [notice, setNotice] = useState("");

  const metrics = useMemo(() => calculateAlbumMetrics(album, analyses), [album, analyses]);
  const localEvaluation = useMemo(() => evaluateAlbumLocally(activityType, album, analyses), [activityType, album, analyses]);

  if (!album) {
    return (
      <div>
        <FlowStepper current="demo" />
        <PageHeader
          eyebrow="Step 04 / Showcase"
          title="AI 生成电子相册展示"
          description="这里会展示生成后的电子相册。当前还没有相册数据，请先完成上传、分析和生成。"
        />
        <EmptyState
          title="暂无相册结果"
          description="完成智能生成后，这里会出现封面、九宫格、故事线、文案和汇报视图。"
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/upload">
                <PrimaryButton>重新上传照片</PrimaryButton>
              </Link>
              <PrimaryButton
                variant="secondary"
                onClick={() => {
                  loadDemoProject();
                  navigate("/demo");
                }}
              >
                加载演示项目
              </PrimaryButton>
            </div>
          }
        />
        <div className="mt-6">
          <GlassCard title="恢复最近草稿" description="本地草稿可在后端离线时继续恢复展示。">
            <DraftHistoryPanel
              limit={3}
              onRestore={(id) => {
                if (restoreDraft(id)) navigate("/demo");
              }}
            />
          </GlassCard>
        </div>
      </div>
    );
  }

  const selectedCaption = album.captions[captionKey];
  const titleSummaryCaption = `${album.title}\n\n${album.summary}\n\n${selectedCaption}`;

  const reupload = () => {
    resetDemo();
    navigate("/upload");
  };

  const exportMarkdown = () => {
    downloadTextFile("yijing-ai-album-report.md", buildMarkdownReport(activityType, album, analyses));
    setNotice("已导出 Markdown 报告。");
  };

  const exportJson = () => {
    downloadTextFile("yijing-ai-album-report.json", buildJsonReport(activityType, album, analyses, localEvaluation), "application/json;charset=utf-8");
    setNotice("已导出 JSON 报告。");
  };

  const exportHtml = () => {
    downloadTextFile("yijing-ai-album.html", buildHtmlAlbum(activityType, album, analyses, localEvaluation), "text/html;charset=utf-8");
    setNotice("已导出 HTML 相册。");
  };

  const exportMoments = () => {
    downloadTextFile("yijing-ai-moments-package.txt", buildMomentsPackage(activityType, album, analyses), "text/plain;charset=utf-8");
    setNotice("已导出朋友圈文案包。");
  };

  const exportScript = () => {
    downloadTextFile("yijing-ai-presentation-script.md", buildPresentationScript(activityType, album, analyses, localEvaluation));
    setNotice("已导出答辩讲解稿。");
  };

  const exportOnePager = () => {
    downloadTextFile(
      "yijing-ai-project-one-pager.html",
      buildProjectOnePager(activityType, album, analyses, localEvaluation, providerStatus),
      "text/html;charset=utf-8",
    );
    setNotice("已导出一页式项目汇报。");
  };

  return (
    <div className="space-y-6">
      <Toast message={notice} tone="success" onClose={() => setNotice("")} />
      <FlowStepper current="demo" />
      <PageHeader
        eyebrow="Step 04 / Showcase"
        title="AI 生成电子相册成品"
        description="面向路演展示的多视图相册：封面、朋友圈九宫格、故事线、文案和汇报结构一站式呈现。"
      />

      <GlassCard>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {viewModes.map((mode) => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.key}
                  type="button"
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition ${
                    viewMode === mode.key ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                  onClick={() => setViewMode(mode.key)}
                >
                  <Icon size={16} />
                  {mode.label}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2">
            <PrimaryButton variant="secondary" onClick={exportMarkdown}>
              <Download size={16} />
              Markdown
            </PrimaryButton>
            <PrimaryButton variant="secondary" onClick={exportJson}>
              <FileJson size={16} />
              JSON
            </PrimaryButton>
            <PrimaryButton variant="secondary" onClick={exportHtml}>
              <Globe2 size={16} />
              HTML
            </PrimaryButton>
            <PrimaryButton variant="secondary" onClick={exportMoments}>朋友圈文案包</PrimaryButton>
            <PrimaryButton variant="secondary" onClick={exportScript}>答辩讲解稿</PrimaryButton>
            <PrimaryButton variant="secondary" onClick={exportOnePager}>项目汇报页</PrimaryButton>
          </div>
        </div>
      </GlassCard>

      {viewMode === "cover" && (
        <GlassCard className="overflow-hidden p-0">
          <div className="grid md:grid-cols-[1.08fr_0.92fr]">
            <div className="h-[420px] bg-slate-100">
              <SafeImage src={album.cover_image_url} alt={album.title} className="h-full w-full object-cover" />
            </div>
            <div className="flex min-h-[360px] flex-col justify-center p-6 md:h-[420px] md:p-8">
              <StatusBadge label={activityType} tone="blue" />
              <h2 className="mt-4 text-3xl font-bold leading-tight text-ink md:text-4xl">{album.title}</h2>
              <p className="mt-4 leading-7 text-muted">{album.summary}</p>
              <div className="mt-6 grid grid-cols-3 gap-3">
                <MetricCard label="照片" value={analyses.length} />
                <MetricCard label="人物" value={totalPeople(analyses)} />
                <MetricCard label="九宫格" value={album.grid_recommendations.length} />
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {viewMode === "grid" && (
        <GlassCard
          title="朋友圈九宫格"
          description="标准 3x3 正方形布局，适合直接展示发布顺序。"
          action={
            <button type="button" className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700" onClick={() => setShowGridLabels((value) => !value)}>
              {showGridLabels ? "隐藏标签" : "显示标签"}
            </button>
          }
        >
          <div className="mx-auto grid max-w-3xl grid-cols-3 gap-2">
            {album.grid_recommendations.map((item) => (
              <figure key={item.position} className="relative overflow-hidden rounded-2xl bg-slate-100">
                <SafeImage src={item.url} alt={item.position} className="aspect-square w-full object-cover" />
                {showGridLabels && (
                  <figcaption className="absolute inset-x-2 bottom-2 rounded-xl bg-slate-950/70 px-2 py-1 text-xs font-bold text-white backdrop-blur">
                    {item.position} · {item.suggested_use}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </GlassCard>
      )}

      {viewMode === "story" && (
        <GlassCard title="故事线模式" description="四段式叙事，每个阶段绑定一张代表图。">
          <div className="grid gap-4 md:grid-cols-4">
            {album.storyline.map((item, index) => {
              const image = album.grid_recommendations[index % Math.max(album.grid_recommendations.length, 1)];
              return (
                <article key={item.step} className="overflow-hidden rounded-2xl border border-white/70 bg-white/80 shadow-sm">
                  {image && <SafeImage src={image.url} alt={item.title} className="aspect-[4/3] w-full object-cover" />}
                  <div className="p-4">
                    <StatusBadge label={item.step} tone="violet" />
                    <h3 className="mt-3 text-lg font-bold text-ink">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </GlassCard>
      )}

      {viewMode === "caption" && (
        <GlassCard title="文案模式" description="四种文案面向不同发布场景，可复制单条或完整文案组。">
          <div className="mb-4 flex flex-wrap gap-2">
            {(Object.keys(album.captions) as CaptionKey[]).map((key) => (
              <button
                key={key}
                type="button"
                className={`rounded-full border px-4 py-2 text-sm font-bold transition ${captionKey === key ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
                onClick={() => setCaptionKey(key)}
              >
                {captionLabels[key]}
              </button>
            ))}
          </div>
          <div className="rounded-2xl bg-slate-50 p-5 leading-8 text-slate-800">{selectedCaption}</div>
          <div className="mt-4 flex flex-wrap gap-3">
            <CopyButton text={selectedCaption} label="复制当前文案" />
            <CopyButton text={Object.entries(album.captions).map(([key, value]) => `${captionLabels[key as CaptionKey]}\n${value}`).join("\n\n")} label="复制全部文案" />
            <CopyButton text={titleSummaryCaption} label="复制标题 + 摘要 + 文案" />
          </div>
        </GlassCard>
      )}

      {viewMode === "report" && (
        <GlassCard title="比赛汇报模式" description="用答辩逻辑解释输入、分析、编排和输出成果。">
          <div className="grid gap-4 md:grid-cols-4">
            {[
              ["项目输入", `${analyses.length} 张校园活动照片，活动类型为${activityType}。`],
              ["AI 分析", `识别场景、情绪、人物数量、质量分和视觉焦点，平均质量 ${metrics.averageQuality}。`],
              ["智能编排", `生成 ${album.grid_recommendations.length} 张九宫格推荐，图片覆盖率 ${metrics.coverage}%。`],
              ["输出成果", `生成电子相册、4 类文案，并支持 Markdown / JSON / HTML 导出。`],
            ].map(([title, text]) => (
              <div key={title} className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
                <h3 className="text-lg font-bold text-ink">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted">{text}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {viewMode === "trace" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <GlassCard title="AI Trace 生成轨迹" description="展示 provider、模型、fallback、偏好和参与生成的素材规模。">
            <AITracePanel
              providerStatus={providerStatus}
              preferences={preferences}
              analysesCount={analyses.length}
              gridCount={album.grid_recommendations.length}
              captionCount={Object.keys(album.captions).length}
            />
          </GlassCard>
          <GlassCard title="相册评分摘要" description="本地评分用于辅助判断相册是否适合分享和路演。">
            <div className="text-5xl font-bold text-ink">{localEvaluation.score}</div>
            <div className="mt-4 space-y-2">
              {localEvaluation.suggestions.map((suggestion) => (
                <div key={suggestion} className="rounded-xl bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800">
                  {suggestion}
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      <GlassCard>
        <div className="flex flex-wrap gap-3">
          <PrimaryButton variant="secondary" onClick={() => navigate("/generate")}>
            <ArrowLeft size={18} />
            返回相册生成页
          </PrimaryButton>
          <PrimaryButton variant="ghost" onClick={reupload}>
            <RefreshCw size={18} />
            重新上传照片
          </PrimaryButton>
        </div>
      </GlassCard>

      <p className="pb-2 text-center text-xs leading-5 text-slate-400">当前版本已预留多模态模型接口，可替换为真实视觉理解模型。</p>
    </div>
  );
}

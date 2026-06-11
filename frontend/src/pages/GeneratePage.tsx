import { ArrowRight, Download, FileJson, FileText, Globe2, Loader2, Save, WandSparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AITracePanel } from "../components/AITracePanel";
import { AlbumScorePanel } from "../components/AlbumScorePanel";
import { AssetPanel } from "../components/AssetPanel";
import { CaptionEditor } from "../components/CaptionEditor";
import { DraftHistoryPanel } from "../components/DraftHistoryPanel";
import { EditableGrid } from "../components/EditableGrid";
import { EmptyState } from "../components/EmptyState";
import { FlowStepper } from "../components/FlowStepper";
import { GlassCard } from "../components/GlassCard";
import { MetricCard } from "../components/MetricCard";
import { PageHeader } from "../components/PageHeader";
import { PrimaryButton } from "../components/PrimaryButton";
import { StorylineEditor } from "../components/StorylineEditor";
import { Toast, type ToastTone } from "../components/Toast";
import { useAppState } from "../context/AppContext";
import { evaluateAlbumLocally } from "../lib/evaluation";
import { generateAlbum, healthCheck, regenerateCaption, regenerateStoryline, regenerateTitle } from "../lib/api";
import { buildHtmlAlbum, buildJsonReport, buildMarkdownReport, buildMomentsPackage, buildPresentationScript, buildProjectOnePager, downloadTextFile } from "../lib/report";
import type { CaptionKey, ImageAnalysis } from "../types";

const visualStyles = ["清新校园", "科技路演", "电影叙事", "正式汇报", "朋友圈生活感"];
const captionLengths = ["短", "中", "长"];
const emphases = ["人物", "氛围", "成果", "过程", "情绪"];
const outputScenes = ["朋友圈", "公众号", "比赛汇报", "毕业纪念册"];
const phases = ["理解图片语义", "规划故事线", "选择九宫格", "生成文案"];

interface ToastState {
  message: string;
  tone: ToastTone;
}

export function GeneratePage() {
  const navigate = useNavigate();
  const {
    activityType,
    analyses,
    album,
    setAlbum,
    preferences,
    setPreferences,
    providerStatus,
    setProviderStatus,
    setSelectedCoverUrl,
    saveCurrentDraft,
    restoreDraft,
    loadDemoProject,
    updateAlbum,
    updateGrid,
    updateCaptions,
    updateStoryline,
  } = useAppState();
  const [loading, setLoading] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [captionLoadingKey, setCaptionLoadingKey] = useState<CaptionKey | null>(null);
  const [storyLoading, setStoryLoading] = useState(false);
  const [titleLoading, setTitleLoading] = useState(false);
  const [originalCaptions, setOriginalCaptions] = useState(album?.captions ?? null);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<string | undefined>();

  useEffect(() => {
    healthCheck()
      .then((status) => {
        setProviderStatus(status);
      });
  }, [setProviderStatus]);

  useEffect(() => {
    if (!loading) return;
    const timer = window.setInterval(() => setPhaseIndex((value) => (value + 1) % phases.length), 850);
    return () => window.clearInterval(timer);
  }, [loading]);

  useEffect(() => {
    if (album && !originalCaptions) setOriginalCaptions(album.captions);
  }, [album, originalCaptions]);

  const evaluation = useMemo(() => evaluateAlbumLocally(activityType, album, analyses), [activityType, album, analyses]);
  const providerLabel = providerStatus?.ai_provider === "mock" ? "本地兜底" : providerStatus?.ai_provider ?? "unknown";
  const fallbackLabel = providerStatus?.fallback === "mock" ? "本地兜底" : providerStatus?.fallback ?? "本地兜底";

  const pushToast = (message: string, tone: ToastTone = "info") => setToast({ message, tone });

  const startGenerate = async () => {
    if (analyses.length === 0) {
      pushToast("请先完成 AI 图片分析。", "error");
      return;
    }

    setLoading(true);
    setPhaseIndex(0);
    try {
      const result = await generateAlbum(activityType, analyses, preferences);
      setAlbum(result.album);
      setOriginalCaptions(result.album.captions);
      setSelectedCoverUrl(result.album.cover_image_url);
      setLastGeneratedAt(new Date().toISOString());
      pushToast("相册方案已生成，并已自动保存草稿。", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "相册生成失败。", "error");
    } finally {
      setLoading(false);
    }
  };

  const addToGrid = (image: ImageAnalysis) => {
    if (!album) return;
    if (album.grid_recommendations.some((item) => item.image_id === image.id)) {
      pushToast("该图片已在九宫格中。", "info");
      return;
    }
    if (album.grid_recommendations.length >= 9) {
      pushToast("九宫格最多 9 张，请先移除一张。", "error");
      return;
    }
    updateGrid([
      ...album.grid_recommendations,
      {
        position: `P${album.grid_recommendations.length + 1}`,
        image_id: image.id,
        url: image.url,
        reason: `从素材池手动加入，画面重点为“${image.visual_focus}”。`,
        suggested_use: image.suggested_use,
      },
    ]);
  };

  const setCover = (image: ImageAnalysis) => {
    setSelectedCoverUrl(image.url);
    updateAlbum({ cover_image_url: image.url });
    setPreferences({
      ...preferences,
      must_include_image_ids: Array.from(new Set([...(preferences.must_include_image_ids ?? []), image.id])),
    });
    pushToast("已设为封面，并加入 must_include 偏好。", "success");
  };

  const saveDraft = () => {
    const draft = saveCurrentDraft();
    pushToast(draft ? "草稿已保存。" : "暂无可保存的相册。", draft ? "success" : "error");
  };

  const handleCaptionRegenerate = async (key: CaptionKey, instruction: string) => {
    if (!album) return;
    setCaptionLoadingKey(key);
    try {
      const result = await regenerateCaption(activityType, analyses, album, key, preferences, instruction);
      updateCaptions({ ...album.captions, [key]: result.caption });
      pushToast(result.fallback ? "已使用 fallback 生成文案。" : "已完成 DeepSeek 文案重生成。", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "文案重生成失败。", "error");
    } finally {
      setCaptionLoadingKey(null);
    }
  };

  const handleTitleRegenerate = async () => {
    if (!album) return;
    setTitleLoading(true);
    try {
      const result = await regenerateTitle(activityType, analyses, album, preferences, preferences.custom_instruction ?? "");
      updateAlbum({ title: result.title, summary: result.summary });
      pushToast(result.fallback ? "已使用 fallback 重生成标题摘要。" : "已完成 DeepSeek 标题摘要重生成。", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "标题重生成失败。", "error");
    } finally {
      setTitleLoading(false);
    }
  };

  const handleStoryRegenerate = async (instruction: string) => {
    if (!album) return;
    setStoryLoading(true);
    try {
      const result = await regenerateStoryline(activityType, analyses, album, preferences, instruction || preferences.custom_instruction || "");
      updateStoryline(result.storyline);
      pushToast(result.fallback ? "已使用 fallback 重生成故事线。" : "已完成 DeepSeek 故事线重生成。", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "故事线重生成失败。", "error");
    } finally {
      setStoryLoading(false);
    }
  };

  const exportAll = (kind: "markdown" | "json" | "html" | "moments" | "script" | "onepager") => {
    if (!album) return;
    if (kind === "markdown") downloadTextFile("yijing-ai-album-report.md", buildMarkdownReport(activityType, album, analyses));
    if (kind === "json") downloadTextFile("yijing-ai-album-report.json", buildJsonReport(activityType, album, analyses, evaluation), "application/json;charset=utf-8");
    if (kind === "html") downloadTextFile("yijing-ai-album.html", buildHtmlAlbum(activityType, album, analyses, evaluation), "text/html;charset=utf-8");
    if (kind === "moments") downloadTextFile("yijing-ai-moments-package.txt", buildMomentsPackage(activityType, album, analyses), "text/plain;charset=utf-8");
    if (kind === "script") downloadTextFile("yijing-ai-presentation-script.md", buildPresentationScript(activityType, album, analyses, evaluation));
    if (kind === "onepager") {
      downloadTextFile(
        "yijing-ai-project-one-pager.html",
        buildProjectOnePager(activityType, album, analyses, evaluation, providerStatus),
        "text/html;charset=utf-8",
      );
    }
    pushToast("导出完成。", "success");
  };

  return (
    <div>
      <Toast message={toast?.message ?? ""} tone={toast?.tone} onClose={() => setToast(null)} />
      <FlowStepper current="generate" />
      <PageHeader
        eyebrow="Step 03 / Album Studio"
        title="Album Studio 相册编辑工作台"
        description="生成之后可继续编辑、拖拽排序、局部重生成、保存草稿和导出，形成完整校园 AI 相册创作流程。"
      />

      <GlassCard className="mb-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid flex-1 gap-3 md:grid-cols-5">
            <MetricCard label="活动类型" value={activityType} />
            <MetricCard label="图片数量" value={analyses.length} />
            <MetricCard label="Provider" value={providerLabel} />
            <MetricCard label="Model" value={providerStatus?.deepseek_model ?? "本地兜底模型"} />
            <MetricCard label="Fallback" value={fallbackLabel} />
          </div>
          <div className="flex flex-wrap gap-2">
            <PrimaryButton onClick={startGenerate} disabled={loading || analyses.length === 0}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : <WandSparkles size={18} />}
              智能生成
            </PrimaryButton>
            <PrimaryButton variant="secondary" onClick={saveDraft} disabled={!album}>
              <Save size={18} />
              保存草稿
            </PrimaryButton>
            <PrimaryButton variant="secondary" onClick={() => exportAll("markdown")} disabled={!album}>
              <Download size={18} />
              导出
            </PrimaryButton>
            <PrimaryButton variant="secondary" disabled={!album} onClick={() => navigate("/demo")}>
              查看最终展示
              <ArrowRight size={18} />
            </PrimaryButton>
          </div>
        </div>
        {loading && (
          <div className="mt-5 grid gap-2 md:grid-cols-4">
            {phases.map((phase, index) => (
              <div key={phase} className={`rounded-2xl border p-3 text-sm font-bold ${index === phaseIndex ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-100 bg-slate-50 text-slate-500"}`}>
                {phase}
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <GlassCard title="生成偏好" description="这些偏好会进入 DeepSeek prompt；本地兜底服务也会轻量体现。" className="mb-6">
        <div className="grid gap-4 lg:grid-cols-4">
          <PreferenceGroup title="相册风格" options={visualStyles} value={preferences.visual_style} onChange={(value) => setPreferences({ ...preferences, visual_style: value })} />
          <PreferenceGroup title="文案长度" options={captionLengths} value={preferences.caption_length} onChange={(value) => setPreferences({ ...preferences, caption_length: value })} />
          <PreferenceGroup title="重点倾向" options={emphases} value={preferences.emphasis} onChange={(value) => setPreferences({ ...preferences, emphasis: value })} />
          <PreferenceGroup title="输出场景" options={outputScenes} value={preferences.output_scene} onChange={(value) => setPreferences({ ...preferences, output_scene: value })} />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input className="focus-ring rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="标题风格" value={preferences.title_style ?? ""} onChange={(event) => setPreferences({ ...preferences, title_style: event.target.value })} />
          <input className="focus-ring rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="目标受众" value={preferences.audience ?? ""} onChange={(event) => setPreferences({ ...preferences, audience: event.target.value })} />
          <input className="focus-ring rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="自定义要求" value={preferences.custom_instruction ?? ""} onChange={(event) => setPreferences({ ...preferences, custom_instruction: event.target.value })} />
        </div>
      </GlassCard>

      {!album ? (
        <div className="space-y-6">
          <EmptyState
            title={analyses.length === 0 ? "暂无可生成素材" : "等待生成相册"}
            description={
              analyses.length === 0
                ? "当前没有图片分析结果。可以返回上传页导入素材，也可以加载演示项目直接进入 Album Studio。"
                : "请点击“智能生成”生成相册方案。你也可以从本地草稿恢复已有项目。"
            }
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <PrimaryButton
                  onClick={() => {
                    loadDemoProject();
                    navigate("/generate");
                  }}
                >
                  加载演示项目
                </PrimaryButton>
                <Link to="/upload">
                  <PrimaryButton variant="secondary">返回上传</PrimaryButton>
                </Link>
              </div>
            }
          />
          <GlassCard title="恢复最近草稿" description="本地草稿可在后端离线时继续恢复编辑。">
            <DraftHistoryPanel
              limit={3}
              onRestore={(id) => {
                const draft = restoreDraft(id);
                pushToast(draft ? "草稿已恢复。" : "草稿不存在。", draft ? "success" : "error");
              }}
            />
          </GlassCard>
        </div>
      ) : (
        <>
          <div className="grid gap-6 2xl:grid-cols-[340px_1fr_360px]">
            <GlassCard title="左侧素材池" description="筛选图片、设为封面或补入九宫格。">
              <AssetPanel analyses={analyses} grid={album.grid_recommendations} onAddToGrid={addToGrid} onSetCover={setCover} />
            </GlassCard>

            <GlassCard title="中间九宫格编辑区" description="拖拽调整 P1-P9 顺序，移除不需要的图片，或从素材池补入。">
              <EditableGrid grid={album.grid_recommendations} onChange={updateGrid} />
            </GlassCard>

            <div className="space-y-6">
              <GlassCard title="右侧 AI 策划面板" description="标题、摘要、故事线和 AI 策划依据。">
                <div className="space-y-3">
                  <input className="focus-ring w-full rounded-xl border border-slate-200 px-3 py-2 text-lg font-bold" value={album.title} onChange={(event) => updateAlbum({ title: event.target.value })} />
                  <textarea className="focus-ring min-h-28 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm leading-6" value={album.summary} onChange={(event) => updateAlbum({ summary: event.target.value })} />
                  <PrimaryButton variant="secondary" onClick={handleTitleRegenerate} disabled={titleLoading}>
                    <WandSparkles size={16} />
                    {titleLoading ? "重生成中" : "重生成标题摘要"}
                  </PrimaryButton>
                </div>
                <div className="mt-5">
                  <StorylineEditor storyline={album.storyline} onChange={updateStoryline} onRegenerate={handleStoryRegenerate} loading={storyLoading} />
                </div>
              </GlassCard>

              <GlassCard title="相册质量评分">
                <AlbumScorePanel evaluation={evaluation} />
              </GlassCard>

              <GlassCard title="AI Trace 生成轨迹">
                <AITracePanel providerStatus={providerStatus} preferences={preferences} analysesCount={analyses.length} gridCount={album.grid_recommendations.length} captionCount={Object.keys(album.captions).length} generatedAt={lastGeneratedAt} />
              </GlassCard>

              <GlassCard title="本地草稿">
                <DraftHistoryPanel
                  onRestore={(id) => {
                    const draft = restoreDraft(id);
                    pushToast(draft ? "草稿已恢复。" : "草稿不存在。", draft ? "success" : "error");
                  }}
                />
              </GlassCard>
            </div>
          </div>

          <GlassCard title="底部文案面板" description="四种文案均支持编辑、复制、恢复 AI 原文和局部重生成。" className="mt-6">
            <CaptionEditor
              captions={album.captions}
              originalCaptions={originalCaptions ?? album.captions}
              onChange={updateCaptions}
              onRegenerate={handleCaptionRegenerate}
              loadingKey={captionLoadingKey}
            />
          </GlassCard>

          <GlassCard title="导出中心" description="Album Studio 和最终展示页都支持导出。这里可直接输出比赛材料。" className="mt-6">
            <div className="flex flex-wrap gap-3">
              <PrimaryButton variant="secondary" onClick={() => exportAll("markdown")}><FileText size={16} />Markdown</PrimaryButton>
              <PrimaryButton variant="secondary" onClick={() => exportAll("json")}><FileJson size={16} />JSON</PrimaryButton>
              <PrimaryButton variant="secondary" onClick={() => exportAll("html")}><Globe2 size={16} />HTML</PrimaryButton>
              <PrimaryButton variant="secondary" onClick={() => exportAll("moments")}>朋友圈文案包</PrimaryButton>
              <PrimaryButton variant="secondary" onClick={() => exportAll("script")}>答辩讲解稿</PrimaryButton>
              <PrimaryButton variant="secondary" onClick={() => exportAll("onepager")}>项目汇报页</PrimaryButton>
            </div>
          </GlassCard>
        </>
      )}

      <div className="mt-6">
        <Link to="/analysis">
          <PrimaryButton variant="ghost">返回分析页</PrimaryButton>
        </Link>
      </div>
    </div>
  );
}

function PreferenceGroup({ title, options, value, onChange }: { title: string; options: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <div className="mb-2 text-sm font-bold text-slate-700">{title}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={`rounded-full border px-3 py-2 text-xs font-bold transition ${value === option ? "border-violet-600 bg-violet-50 text-violet-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

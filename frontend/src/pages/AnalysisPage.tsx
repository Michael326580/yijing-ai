import { ArrowRight, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { PrimaryButton } from "../components/PrimaryButton";
import { useAppState } from "../context/AppContext";
import { analyzeImages } from "../lib/api";

export function AnalysisPage() {
  const navigate = useNavigate();
  const { activityType, localImages, analyses, setAnalyses, setAlbum } = useAppState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startAnalysis = async () => {
    if (localImages.length === 0) {
      setError("请先在上传页选择图片。");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await analyzeImages(activityType, localImages.map((image) => image.file));
      setAnalyses(result.analyses);
      setAlbum(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI 分析失败。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Step 02 / AI Analysis"
        title="生成每张照片的 AI 分析结果"
        description="系统会根据活动类型和图片顺序生成结构化图像理解结果，包括场景、情绪、物体、人数、视觉焦点、画面质量和推荐用途。"
      />

      <div className="mb-6 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium leading-6 text-blue-800">
        当前为演示版流程，已预留多模态模型接口，可替换为真实视觉理解模型。
      </div>

      <section className="mb-6 rounded-lg border border-white bg-white/90 p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold text-blue-700">当前活动类型：{activityType}</div>
            <div className="mt-1 text-sm text-muted">待分析图片 {localImages.length} 张；已有分析结果 {analyses.length} 条。</div>
          </div>
          <div className="flex flex-wrap gap-3">
            <PrimaryButton onClick={startAnalysis} disabled={loading || localImages.length === 0}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              开始 AI 分析
            </PrimaryButton>
            <PrimaryButton variant="secondary" disabled={analyses.length === 0} onClick={() => navigate("/generate")}>
              生成相册
              <ArrowRight size={18} />
            </PrimaryButton>
            <Link to="/upload">
              <PrimaryButton variant="ghost">
                <RefreshCw size={18} />
                返回上传
              </PrimaryButton>
            </Link>
          </div>
        </div>
        {error && <div className="mt-4 rounded-lg bg-red-50 px-3 py-3 text-sm text-red-700">{error}</div>}
      </section>

      {analyses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white/70 p-10 text-center text-muted">
          点击“开始 AI 分析”后，这里会展示每张图片的结构化结果。
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {analyses.map((image, index) => (
            <article key={image.id} className="grid gap-4 rounded-lg border border-white bg-white/90 p-4 shadow-sm sm:grid-cols-[160px_1fr]">
              <img src={image.url} alt={`照片 ${index + 1}`} className="aspect-[4/3] w-full rounded-lg object-cover" />
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">{image.suggested_use}</span>
                  <span className="rounded-md bg-violet-50 px-2 py-1 text-xs font-bold text-violet-700">质量 {image.quality}</span>
                </div>
                <h2 className="text-lg font-bold text-ink">照片 {index + 1}</h2>
                <div className="mt-1 truncate text-xs text-slate-400">原始文件：{image.filename}</div>
                <p className="mt-2 text-sm leading-6 text-slate-700">{image.caption}</p>
                <dl className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                  <Info label="scene" value={image.scene} />
                  <Info label="emotion" value={image.emotion} />
                  <Info label="people_count" value={`${image.people_count}`} />
                  <Info label="visual_focus" value={image.visual_focus} />
                  <Info label="objects" value={image.objects.join("、")} wide />
                </dl>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Info({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <dt className="text-xs font-semibold uppercase text-slate-400">{label}</dt>
      <dd className="mt-0.5 font-medium text-slate-700">{value}</dd>
    </div>
  );
}

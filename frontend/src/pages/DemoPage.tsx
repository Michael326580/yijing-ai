import { ArrowLeft, Copy, Download, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { PrimaryButton } from "../components/PrimaryButton";
import { useAppState } from "../context/AppContext";
import { buildMarkdownReport, captionLabels, downloadTextFile } from "../lib/report";
import type { CaptionKey } from "../types";

export function DemoPage() {
  const navigate = useNavigate();
  const { activityType, analyses, album, resetDemo } = useAppState();
  const [captionKey, setCaptionKey] = useState<CaptionKey>("literary");
  const [notice, setNotice] = useState("");

  if (!album) {
    return (
      <div>
        <PageHeader
          eyebrow="Step 04 / Final Demo"
          title="AI 生成最终展示页"
          description="这里会展示生成后的电子相册。当前还没有相册数据，请先完成上传、分析和生成。"
        />
        <div className="rounded-lg border border-dashed border-slate-200 bg-white/70 p-10 text-center">
          <p className="text-muted">暂无相册结果。</p>
          <div className="mt-5 flex justify-center gap-3">
            <Link to="/upload">
              <PrimaryButton>重新上传照片</PrimaryButton>
            </Link>
            <Link to="/generate">
              <PrimaryButton variant="secondary">返回相册生成页</PrimaryButton>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const selectedCaption = album.captions[captionKey];

  const copyCaption = async () => {
    try {
      await navigator.clipboard.writeText(selectedCaption);
      setNotice("已复制朋友圈文案。");
    } catch {
      setNotice("复制失败，请手动选中文案复制。");
    }
  };

  const exportReport = () => {
    const markdown = buildMarkdownReport(activityType, album, analyses);
    downloadTextFile("yijing-ai-album-report.md", markdown);
    setNotice("已导出 Markdown 相册分析报告。");
  };

  const reupload = () => {
    resetDemo();
    navigate("/upload");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Step 04 / Final Demo"
        title="AI 生成电子相册展示"
        description="用于高校创新比赛现场演示：完整呈现相册标题、活动故事线、九宫格排序、朋友圈文案和导出能力。"
      />

      <section className="overflow-hidden rounded-lg border border-white bg-white shadow-soft">
        <div className="grid md:grid-cols-[1.05fr_0.95fr]">
          <div className="min-h-[360px] bg-slate-100">
            {album.cover_image_url ? (
              <img src={album.cover_image_url} alt={album.title} className="h-full min-h-[360px] w-full object-cover" />
            ) : (
              <div className="flex h-full min-h-[360px] items-center justify-center text-muted">暂无封面图片</div>
            )}
          </div>
          <div className="flex flex-col justify-center p-6 md:p-8">
            <div className="mb-3 inline-flex w-fit rounded-lg bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">{activityType}</div>
            <h2 className="text-3xl font-bold leading-tight text-ink md:text-4xl">{album.title}</h2>
            <p className="mt-4 leading-7 text-muted">{album.summary}</p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <Stat label="照片" value={`${analyses.length}`} />
              <Stat label="九宫格" value={`${album.grid_recommendations.length}`} />
              <Stat label="文案" value="4" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {album.storyline.map((item) => (
          <article key={item.step} className="rounded-lg border border-white bg-white/90 p-5 shadow-sm">
            <div className="text-sm font-bold text-blue-700">{item.step}</div>
            <h3 className="mt-2 text-lg font-bold text-ink">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
          </article>
        ))}
      </section>

      <section className="rounded-lg border border-white bg-white/90 p-5 shadow-sm">
        <h2 className="text-xl font-bold text-ink">朋友圈九宫格</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          {album.grid_recommendations.map((item) => (
            <figure key={item.position} className="overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
              <img src={item.url} alt={item.position} className="aspect-square w-full object-cover" />
              <figcaption className="px-3 py-2 text-sm font-bold text-slate-700">{item.position} · {item.suggested_use}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-white bg-white/90 p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-ink">朋友圈文案</h2>
            <p className="mt-1 text-sm text-muted">选择一个版本后可一键复制。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(album.captions) as CaptionKey[]).map((key) => (
              <button
                key={key}
                type="button"
                className={[
                  "focus-ring rounded-lg border px-3 py-2 text-sm font-semibold transition",
                  captionKey === key ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                ].join(" ")}
                onClick={() => setCaptionKey(key)}
              >
                {captionLabels[key]}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-4 rounded-lg bg-slate-50 p-4 leading-7 text-slate-800">{selectedCaption}</p>
      </section>

      <section className="flex flex-wrap gap-3 rounded-lg border border-white bg-white/90 p-5 shadow-sm">
        <PrimaryButton onClick={copyCaption}>
          <Copy size={18} />
          一键复制朋友圈文案
        </PrimaryButton>
        <PrimaryButton variant="secondary" onClick={exportReport}>
          <Download size={18} />
          导出相册分析报告
        </PrimaryButton>
        <PrimaryButton variant="secondary" onClick={() => navigate("/generate")}>
          <ArrowLeft size={18} />
          返回相册生成页
        </PrimaryButton>
        <PrimaryButton variant="ghost" onClick={reupload}>
          <RefreshCw size={18} />
          重新上传照片
        </PrimaryButton>
        {notice && <div className="flex items-center rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">{notice}</div>}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-center">
      <div className="text-2xl font-bold text-ink">{value}</div>
      <div className="mt-1 text-xs font-semibold text-muted">{label}</div>
    </div>
  );
}

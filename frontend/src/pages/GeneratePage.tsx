import { ArrowRight, Loader2, WandSparkles } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { PrimaryButton } from "../components/PrimaryButton";
import { useAppState } from "../context/AppContext";
import { generateAlbum } from "../lib/api";
import { captionLabels } from "../lib/report";
import type { CaptionKey } from "../types";

export function GeneratePage() {
  const navigate = useNavigate();
  const { activityType, analyses, album, setAlbum } = useAppState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startGenerate = async () => {
    if (analyses.length === 0) {
      setError("请先完成 AI 图片分析。");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await generateAlbum(activityType, analyses);
      setAlbum(result.album);
    } catch (err) {
      setError(err instanceof Error ? err.message : "相册生成失败。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Step 03 / Album Generator"
        title="AI 生成故事线、九宫格和朋友圈文案"
        description="基于图片分析结果，mock AI 会生成适合校园活动展示的相册结构，并输出四种朋友圈文案风格。"
      />

      <section className="mb-6 rounded-lg border border-white bg-white/90 p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold text-blue-700">已分析 {analyses.length} 张图片</div>
            <p className="mt-1 text-sm text-muted">活动类型：{activityType}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <PrimaryButton onClick={startGenerate} disabled={loading || analyses.length === 0}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : <WandSparkles size={18} />}
              AI 生成相册方案
            </PrimaryButton>
            <PrimaryButton variant="secondary" disabled={!album} onClick={() => navigate("/demo")}>
              查看最终 Demo
              <ArrowRight size={18} />
            </PrimaryButton>
            <Link to="/analysis">
              <PrimaryButton variant="ghost">返回分析页</PrimaryButton>
            </Link>
          </div>
        </div>
        {error && <div className="mt-4 rounded-lg bg-red-50 px-3 py-3 text-sm text-red-700">{error}</div>}
      </section>

      {!album ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white/70 p-10 text-center text-muted">
          点击“AI 生成相册方案”后，这里会展示标题、简介、故事线、九宫格和朋友圈文案。
        </div>
      ) : (
        <div className="space-y-6">
          <section className="rounded-lg border border-white bg-white/90 p-5 shadow-sm">
            <div className="text-sm font-semibold text-blue-700">相册标题</div>
            <h2 className="mt-2 text-3xl font-bold text-ink">{album.title}</h2>
            <p className="mt-3 leading-7 text-muted">{album.summary}</p>
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
            <h2 className="text-xl font-bold text-ink">P1-P9 九宫格推荐</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {album.grid_recommendations.map((item) => (
                <article key={item.position} className="overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                  <img src={item.url} alt={item.position} className="aspect-[4/3] w-full object-cover" />
                  <div className="p-3">
                    <div className="font-bold text-blue-700">{item.position} · {item.suggested_use}</div>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{item.reason}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            {(Object.keys(album.captions) as CaptionKey[]).map((key) => (
              <article key={key} className="rounded-lg border border-white bg-white/90 p-5 shadow-sm">
                <h3 className="text-base font-bold text-blue-700">{captionLabels[key]}</h3>
                <p className="mt-3 leading-7 text-slate-700">{album.captions[key]}</p>
              </article>
            ))}
          </section>
        </div>
      )}
    </div>
  );
}

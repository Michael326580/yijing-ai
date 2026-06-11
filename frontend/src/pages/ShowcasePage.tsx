import { ArrowRight, Download, FileText, Images, Pause, Play, RefreshCw, ShieldCheck, Sparkles, WandSparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "../components/GlassCard";
import { MetricCard } from "../components/MetricCard";
import { PrimaryButton } from "../components/PrimaryButton";
import { SafeImage } from "../components/SafeImage";
import { StatusBadge } from "../components/StatusBadge";
import { Toast } from "../components/Toast";
import { useAppState } from "../context/AppContext";
import { demoActivityType, demoAlbum, demoAnalyses } from "../lib/demoData";
import { evaluateAlbumLocally } from "../lib/evaluation";
import { buildProjectOnePager, downloadTextFile } from "../lib/report";

const flowSteps = [
  { title: "素材上传", text: "导入校园活动照片，完成格式、数量和大小校验。" },
  { title: "本地视觉分析", text: "提取亮度、清晰度、色彩、构图方向和封面候选分。" },
  { title: "DeepSeek 策划", text: "在后端完成相册标题、故事线、九宫格和文案策划。" },
  { title: "Album Studio 编辑", text: "拖拽排序、设封面、局部重生成并保存本地草稿。" },
  { title: "多格式导出", text: "输出 HTML 相册、Markdown 报告、JSON 数据和答辩讲稿。" },
];

const capabilities = ["图片质量评估", "九宫格智能编排", "故事线生成", "多风格文案", "局部重生成", "本地草稿", "fallback 兜底", "HTML / Markdown / JSON 导出"];

export function ShowcasePage() {
  const navigate = useNavigate();
  const { loadDemoProject, providerStatus } = useAppState();
  const [activeStep, setActiveStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [notice, setNotice] = useState("");
  const metrics = useMemo(() => evaluateAlbumLocally(demoActivityType, demoAlbum, demoAnalyses), []);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setActiveStep((step) => {
        const next = (step + 1) % flowSteps.length;
        return next;
      });
    }, 1800);
    return () => window.clearInterval(timer);
  }, [playing]);

  const enterDemo = (target: "/demo" | "/generate") => {
    loadDemoProject();
    navigate(target);
  };

  const exportOnePager = () => {
    downloadTextFile(
      "yijing-ai-project-one-pager.html",
      buildProjectOnePager(demoActivityType, demoAlbum, demoAnalyses, metrics, providerStatus),
      "text/html;charset=utf-8",
    );
    setNotice("已导出一页式项目汇报。");
  };

  return (
    <div className="space-y-8">
      <Toast message={notice} tone="success" onClose={() => setNotice("")} />

      <section className="overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-soft backdrop-blur">
        <div className="grid gap-0 lg:grid-cols-[1fr_0.9fr]">
          <div className="flex min-h-[420px] flex-col justify-center p-7 md:p-10">
            <StatusBadge label="Showcase Mode" tone="blue" />
            <h1 className="mt-5 text-4xl font-black leading-tight text-ink md:text-6xl">
              忆境 AI
              <span className="mt-2 block gradient-text">校园照片 → AI 叙事相册</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
              面向校园活动、科研竞赛、毕业纪念与社团演出的 AI 相册生成工作台。
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <PrimaryButton onClick={() => enterDemo("/demo")}>
                一键进入演示
                <ArrowRight size={18} />
              </PrimaryButton>
              <PrimaryButton variant="secondary" onClick={() => enterDemo("/generate")}>
                进入 Album Studio
              </PrimaryButton>
              <PrimaryButton variant="secondary" onClick={exportOnePager}>
                <Download size={18} />
                导出项目汇报
              </PrimaryButton>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 bg-slate-950 p-4">
            {demoAlbum.grid_recommendations.slice(0, 9).map((item) => (
              <SafeImage key={item.position} src={item.url} alt={item.position} className="aspect-square rounded-2xl object-cover shadow-sm" />
            ))}
          </div>
        </div>
      </section>

      <GlassCard title="产品流程" description="评委可以从左到右理解忆境 AI 的完整产品闭环。">
        <div className="grid gap-3 md:grid-cols-5">
          {flowSteps.map((step, index) => (
            <button
              key={step.title}
              type="button"
              className={`rounded-2xl border p-4 text-left transition ${
                activeStep === index ? "border-blue-500 bg-blue-50 shadow-soft" : "border-slate-100 bg-white/80 hover:bg-slate-50"
              }`}
              onClick={() => setActiveStep(index)}
            >
              <div className="text-xs font-black text-blue-600">0{index + 1}</div>
              <div className="mt-2 font-bold text-ink">{step.title}</div>
              <p className="mt-2 text-sm leading-6 text-muted">{step.text}</p>
            </button>
          ))}
        </div>
        <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-slate-950 p-4 text-white md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-bold text-cyan-200">自动演示讲解</div>
            <div className="mt-1 text-lg font-bold">{flowSteps[activeStep].title}</div>
            <p className="mt-1 text-sm leading-6 text-slate-300">{flowSteps[activeStep].text}</p>
          </div>
          <div className="flex gap-2">
            <PrimaryButton variant="secondary" onClick={() => setPlaying((value) => !value)}>
              {playing ? <Pause size={16} /> : <Play size={16} />}
              {playing ? "暂停" : "开始自动演示"}
            </PrimaryButton>
            <PrimaryButton
              variant="ghost"
              className="text-white hover:bg-white/10"
              onClick={() => {
                setPlaying(false);
                setActiveStep(0);
              }}
            >
              <RefreshCw size={16} />
              重置
            </PrimaryButton>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <GlassCard title="模拟输入素材" description="一组科研竞赛校园照片，覆盖封面、场景、过程、合影、成果和氛围。">
          <div className="grid grid-cols-3 gap-2">
            {demoAnalyses.slice(0, 6).map((image, index) => (
              <figure key={image.id} className="overflow-hidden rounded-2xl bg-slate-100">
                <SafeImage src={image.url} alt={`输入素材 ${index + 1}`} className="aspect-square w-full object-cover" />
                <figcaption className="px-3 py-2 text-xs font-bold text-slate-600">照片 {index + 1}</figcaption>
              </figure>
            ))}
          </div>
        </GlassCard>

        <GlassCard title="最终相册成果" description="系统输出可展示的封面、九宫格、故事线和多风格文案。">
          <div className="grid gap-4 md:grid-cols-[240px_1fr]">
            <SafeImage src={demoAlbum.cover_image_url} alt={demoAlbum.title} className="h-full min-h-64 rounded-2xl object-cover" />
            <div className="flex flex-col justify-center">
              <StatusBadge label={demoActivityType} tone="violet" />
              <h2 className="mt-3 text-2xl font-black text-ink">{demoAlbum.title}</h2>
              <p className="mt-3 text-sm leading-7 text-muted">{demoAlbum.summary}</p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <MetricCard label="素材" value={demoAnalyses.length} />
                <MetricCard label="九宫格" value={demoAlbum.grid_recommendations.length} />
                <MetricCard label="评分" value={metrics.score} />
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      <GlassCard title="关键能力" description="这些能力共同构成可答辩、可交付的 AI 电子相册系统。">
        <div className="grid gap-3 md:grid-cols-4">
          {capabilities.map((item) => (
            <div key={item} className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 font-bold text-blue-900">
              {item}
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard title="系统可靠性" description="比赛现场常见异常均有清晰兜底路径。">
        <div className="grid gap-4 md:grid-cols-4">
          <Reliability icon={<WandSparkles size={20} />} title="DeepSeek 可用" text="后端启用 DeepSeek 增强生成，Key 不进入前端。" />
          <Reliability icon={<Sparkles size={20} />} title="无 Key" text="自动使用本地兜底服务，完整生成相册闭环。" />
          <Reliability icon={<ShieldCheck size={20} />} title="调用失败" text="后端捕获异常并 fallback 兜底，不暴露技术堆栈。" />
          <Reliability icon={<Images size={20} />} title="后端离线" text="一键演示项目和本地草稿仍可展示。" />
        </div>
      </GlassCard>

      <GlassCard title="输出材料" description="现场演示后可直接导出汇报与交付材料。">
        <div className="flex flex-wrap gap-3">
          <PrimaryButton onClick={exportOnePager}>
            <FileText size={18} />
            导出一页式项目汇报
          </PrimaryButton>
          <PrimaryButton variant="secondary" onClick={() => enterDemo("/demo")}>查看最终展示</PrimaryButton>
          <PrimaryButton variant="secondary" onClick={() => enterDemo("/generate")}>打开编辑工作台</PrimaryButton>
        </div>
      </GlassCard>
    </div>
  );
}

function Reliability({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white/85 p-4">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-violet-50 text-blue-700">{icon}</div>
      <div className="font-bold text-ink">{title}</div>
      <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
    </div>
  );
}

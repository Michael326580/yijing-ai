import {
  ArrowRight,
  BrainCircuit,
  FileText,
  FlaskConical,
  Grid3X3,
  ImagePlus,
  Images,
  Mic2,
  PartyPopper,
  School,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { DraftHistoryPanel } from "../components/DraftHistoryPanel";
import { FlowStepper } from "../components/FlowStepper";
import { GlassCard } from "../components/GlassCard";
import { MetricCard } from "../components/MetricCard";
import { PrimaryButton } from "../components/PrimaryButton";
import { StatusBadge } from "../components/StatusBadge";
import { useAppState } from "../context/AppContext";

const features = [
  { icon: BrainCircuit, title: "AI 图片语义分析", text: "提取场景、情绪、人物数量、视觉焦点和推荐用途。" },
  { icon: Sparkles, title: "DeepSeek 相册策划", text: "在后端安全调用模型，生成更贴合活动语境的标题、摘要和故事线。" },
  { icon: Grid3X3, title: "P1-P9 九宫格排序", text: "按封面、场景、过程、合影、成果和氛围组织朋友圈发布顺序。" },
  { icon: FileText, title: "多风格朋友圈文案", text: "输出简洁、热血、文艺、官方四种风格，支持一键复制。" },
  { icon: FileText, title: "汇报级 Markdown 导出", text: "将相册结构、九宫格理由和图片分析明细整理成可提交报告。" },
  { icon: Images, title: "电子相册展示", text: "生成适合比赛路演、公众号展示和校园纪念的成品页。" },
];

const scenes = [
  { icon: Trophy, title: "科研竞赛", desc: "答辩、路演、成果展示" },
  { icon: School, title: "毕业纪念", desc: "校园地标、合影、告别" },
  { icon: FlaskConical, title: "实验室日常", desc: "实验记录、数据讨论" },
  { icon: Users, title: "社团活动", desc: "组织协作、互动现场" },
  { icon: Mic2, title: "舞台演出", desc: "灯光、节目、谢幕" },
  { icon: PartyPopper, title: "朋友聚会", desc: "陪伴、生活感、轻松瞬间" },
];

export function HomePage() {
  const navigate = useNavigate();
  const { loadDemoProject, restoreDraft } = useAppState();

  const openDemoProject = () => {
    loadDemoProject();
    navigate("/demo");
  };

  return (
    <div className="space-y-10">
      <section className="grid items-center gap-8 py-6 md:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm backdrop-blur">
            <Sparkles size={16} />
            校园 AI 电子相册生成系统
          </div>
          <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-normal text-ink md:text-6xl">
            校园照片 → <span className="gradient-text">AI 叙事相册</span>
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-muted">
            基于已有校园活动照片，自动生成电子相册、活动故事线、P1-P9 九宫格排序方案和多风格朋友圈文案。后端支持 DeepSeek 增强，也保留 fallback
            兜底，让比赛演示更稳定。
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
            当前版本支持图片素材，视频与实况内容可通过关键帧提取方式接入后续版本。
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/upload">
              <PrimaryButton>
                开始创建
                <ArrowRight size={18} />
              </PrimaryButton>
            </Link>
            <Link to="/demo">
              <PrimaryButton variant="secondary">查看展示页</PrimaryButton>
            </Link>
            <Link to="/showcase">
              <PrimaryButton variant="secondary">评委演示模式</PrimaryButton>
            </Link>
            <PrimaryButton variant="secondary" onClick={openDemoProject}>加载演示项目</PrimaryButton>
          </div>
        </div>

        <ProductConsolePreview />
      </section>

      <FlowStepper current="upload" />

      <section className="grid gap-4 md:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <GlassCard key={feature.title} className="hover:-translate-y-1">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-700">
                <Icon size={22} />
              </div>
              <h2 className="text-lg font-bold text-ink">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{feature.text}</p>
            </GlassCard>
          );
        })}
      </section>

      <GlassCard title="适用场景" description="覆盖高校活动影像中最常见的六类校园记忆。">
        <div className="grid gap-3 md:grid-cols-3">
          {scenes.map((scene) => {
            const Icon = scene.icon;
            return (
              <div key={scene.title} className="rounded-2xl border border-white/70 bg-slate-50/80 p-4 transition hover:bg-white hover:shadow-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-violet-700 shadow-sm">
                  <Icon size={19} />
                </div>
                <div className="font-bold text-ink">{scene.title}</div>
                <div className="mt-1 text-sm text-muted">{scene.desc}</div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      <GlassCard title="工作流程" description="从素材管理到成品导出，完整覆盖 AI 电子相册生成闭环。">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["01", "上传", "批量导入校园活动图片，自动校验格式和数量。"],
            ["02", "分析", "提取场景、情绪、人物、质量和视觉重点。"],
            ["03", "生成", "结合偏好生成故事线、九宫格和多风格文案。"],
            ["04", "展示", "输出路演级电子相册，并导出 Markdown / JSON / HTML。"],
          ].map(([step, title, desc]) => (
            <div key={step} className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
              <div className="text-sm font-bold text-blue-700">{step}</div>
              <div className="mt-2 text-lg font-bold text-ink">{title}</div>
              <p className="mt-2 text-sm leading-6 text-muted">{desc}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <GlassCard title="最近项目" description="本地草稿存储在浏览器 localStorage 中，适合比赛现场快速恢复。">
          <DraftHistoryPanel
            limit={3}
            onRestore={(id) => {
              if (restoreDraft(id)) navigate("/generate");
            }}
          />
        </GlassCard>
        <GlassCard title="为什么不是普通相册" description="忆境 AI 的重点不是存储，而是把素材变成可展示、可编辑、可导出的作品。">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="font-bold text-slate-700">普通相册</div>
              <p className="mt-2 text-sm leading-6 text-muted">只保存照片，缺少叙事、编排、文案和汇报输出。</p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-4">
              <div className="font-bold text-blue-800">忆境 AI</div>
              <p className="mt-2 text-sm leading-6 text-blue-900/75">分析图片、编排九宫格、生成文案、支持编辑、保存草稿和多格式导出。</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function ProductConsolePreview() {
  return (
    <GlassCard className="relative overflow-hidden">
      <div className="absolute right-[-60px] top-[-60px] h-40 w-40 rounded-full bg-cyan-200/40 blur-3xl" />
      <div className="absolute bottom-[-70px] left-[-70px] h-44 w-44 rounded-full bg-violet-200/40 blur-3xl" />
      <div className="relative">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-muted">AI 工作台</div>
            <div className="text-2xl font-bold text-ink">相册生成控制台</div>
          </div>
          <StatusBadge label="fallback 兜底" tone="amber" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard label="Provider" value="DeepSeek" hint="可切换本地兜底" />
          <MetricCard label="图片分析" value="92%" hint="场景/情绪/人物" />
          <MetricCard label="文案状态" value="4 类" hint="朋友圈/官方" />
        </div>
        <div className="mt-4 rounded-2xl border border-white/70 bg-slate-950/90 p-4 text-white shadow-soft">
          <div className="mb-3 flex items-center gap-2 text-sm text-cyan-200">
            <ImagePlus size={16} />
            Scene Tags
          </div>
          <div className="flex flex-wrap gap-2">
            {["答辩现场", "团队合影", "成果展示", "校园广场", "氛围花絮"].map((tag) => (
              <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, index) => (
              <div key={index} className="aspect-square rounded-xl border border-white/10 bg-gradient-to-br from-blue-500/40 to-violet-500/40 p-2">
                <span className="text-xs font-bold text-white/90">P{index + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

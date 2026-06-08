import { ArrowRight, FileText, Grid3X3, Images, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { PrimaryButton } from "../components/PrimaryButton";

const features = [
  { icon: Sparkles, title: "AI 图像分析", text: "识别校园场景、情绪、人物数量、画面焦点与推荐用途。" },
  { icon: Grid3X3, title: "九宫格编排", text: "自动生成 P1-P9 朋友圈排序方案，让展示更有叙事感。" },
  { icon: FileText, title: "多风格文案", text: "生成简洁、热血、文艺、官方四类朋友圈文案。" },
  { icon: Images, title: "电子相册", text: "输出适合创新比赛展示的校园科技风相册页面。" },
];

export function HomePage() {
  return (
    <div className="space-y-8">
      <section className="grid items-center gap-8 py-8 md:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm font-semibold text-blue-700 shadow-sm">
            <Sparkles size={16} />
            面向高校学生的 AI 电子相册
          </div>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-normal text-ink md:text-6xl">
            用 AI 把沉睡的校园相册重新讲成故事
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
            基于已有校园活动照片，自动生成电子相册、活动故事线、P1-P9 九宫格排序方案和多风格朋友圈文案。
            当前演示版支持图片素材，视频与实况内容可通过关键帧提取方式接入后续版本。
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
          </div>
        </div>

        <div className="rounded-lg border border-white bg-white/85 p-5 shadow-soft">
          <div className="rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 p-5 text-white">
            <div className="text-sm opacity-85">Album Flow</div>
            <div className="mt-2 text-2xl font-bold">上传 → 分析 → 生成 → 展示</div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {["照片", "场景", "文案", "P1-P9", "相册", "报告"].map((item) => (
              <div key={item} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-4 text-center text-sm font-semibold text-slate-700">
                {item}
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-slate-700">
            从素材整理到相册生成，完整覆盖校园记忆电子化展示的核心流程。
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <article key={feature.title} className="rounded-lg border border-white bg-white/90 p-5 shadow-sm">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <Icon size={21} />
              </div>
              <h2 className="text-lg font-bold text-ink">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{feature.text}</p>
            </article>
          );
        })}
      </section>

      <p className="text-center text-xs leading-5 text-slate-400">
        当前为演示版流程，已预留多模态模型接口，可替换为真实视觉理解模型。
      </p>
    </div>
  );
}

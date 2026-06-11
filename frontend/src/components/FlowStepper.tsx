import { Camera, Images, Sparkles, WandSparkles } from "lucide-react";
import { Link } from "react-router-dom";

const steps = [
  { key: "upload", label: "上传素材", to: "/upload", icon: Camera },
  { key: "analysis", label: "AI 分析", to: "/analysis", icon: Sparkles },
  { key: "generate", label: "智能生成", to: "/generate", icon: WandSparkles },
  { key: "demo", label: "相册展示", to: "/demo", icon: Images },
];

export function FlowStepper({ current }: { current: string }) {
  return (
    <div className="mb-6 grid gap-2 rounded-2xl border border-white/70 bg-white/70 p-2 shadow-sm backdrop-blur md:grid-cols-4">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const active = step.key === current;
        return (
          <Link
            key={step.key}
            to={step.to}
            className={`flex items-center gap-3 rounded-xl px-3 py-3 transition ${
              active ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-soft" : "text-slate-600 hover:bg-white"
            }`}
          >
            <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${active ? "bg-white/20" : "bg-blue-50 text-blue-700"}`}>
              <Icon size={18} />
            </span>
            <span>
              <span className="block text-xs font-semibold opacity-75">Step {index + 1}</span>
              <span className="block text-sm font-bold">{step.label}</span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}

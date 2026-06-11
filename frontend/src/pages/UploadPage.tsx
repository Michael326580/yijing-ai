import {
  ArrowLeft,
  ArrowRight,
  Beaker,
  Camera,
  GraduationCap,
  ImagePlus,
  Mic2,
  PartyPopper,
  Trash2,
  Trophy,
  UploadCloud,
  Users,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { FlowStepper } from "../components/FlowStepper";
import { GlassCard } from "../components/GlassCard";
import { ImageGrid } from "../components/ImageGrid";
import { MetricCard } from "../components/MetricCard";
import { PageHeader } from "../components/PageHeader";
import { PrimaryButton } from "../components/PrimaryButton";
import { Toast, type ToastTone } from "../components/Toast";
import { useAppState } from "../context/AppContext";
import { activityTypes, type ActivityType, type LocalImage } from "../types";

const MAX_FILES = 12;
const MAX_SIZE = 10 * 1024 * 1024;
const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

const activityMeta: Record<ActivityType, { icon: typeof Trophy; desc: string }> = {
  科研竞赛: { icon: Trophy, desc: "答辩路演、项目展示、成果证书" },
  毕业纪念: { icon: GraduationCap, desc: "校园地标、毕业合影、青春告别" },
  实验室日常: { icon: Beaker, desc: "实验过程、数据讨论、科研记录" },
  社团活动: { icon: Users, desc: "社团招新、活动组织、互动现场" },
  舞台演出: { icon: Mic2, desc: "后台准备、舞台高光、谢幕瞬间" },
  朋友聚会: { icon: PartyPopper, desc: "生活片段、好友陪伴、轻松氛围" },
};

interface ToastState {
  message: string;
  tone: ToastTone;
}

export function UploadPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { activityType, setActivityType, localImages, setLocalImages, setAnalyses, setAlbum, loadDemoProject } = useAppState();
  const [dragging, setDragging] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const totalSize = useMemo(() => localImages.reduce((sum, image) => sum + image.file.size, 0), [localImages]);
  const remaining = MAX_FILES - localImages.length;

  const pushToast = (message: string, tone: ToastTone = "info") => setToast({ message, tone });

  const handleFiles = (files: FileList | File[] | null) => {
    if (!files) return;
    const nextFiles = Array.from(files);
    const accepted: LocalImage[] = [];

    if (localImages.length + nextFiles.length > MAX_FILES) {
      pushToast(`最多支持 ${MAX_FILES} 张图片，本次还可添加 ${Math.max(remaining, 0)} 张。`, "error");
    }

    for (const file of nextFiles.slice(0, Math.max(remaining, 0))) {
      if (!allowedTypes.includes(file.type)) {
        pushToast(`${file.name} 格式不支持，仅支持 jpg、jpeg、png、webp。`, "error");
        continue;
      }
      if (file.size > MAX_SIZE) {
        pushToast(`${file.name} 超过 10 MB。`, "error");
        continue;
      }
      accepted.push({
        id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    if (accepted.length > 0) {
      setLocalImages([...localImages, ...accepted]);
      setAnalyses([]);
      setAlbum(null);
      pushToast(`已添加 ${accepted.length} 张素材。`, "success");
    }
  };

  const removeImage = (id: string) => {
    const target = localImages.find((image) => image.id === id);
    if (target) URL.revokeObjectURL(target.previewUrl);
    setLocalImages(localImages.filter((image) => image.id !== id));
    setAnalyses([]);
    setAlbum(null);
  };

  const clearImages = () => {
    localImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    setLocalImages([]);
    setAnalyses([]);
    setAlbum(null);
    pushToast("已清空全部素材。", "info");
  };

  const openDemoProject = () => {
    loadDemoProject();
    navigate("/demo");
  };

  return (
    <div>
      <Toast message={toast?.message ?? ""} tone={toast?.tone} onClose={() => setToast(null)} />
      <FlowStepper current="upload" />
      <PageHeader
        eyebrow="Step 01 / Material Console"
        title="素材管理与活动类型设置"
        description="像整理比赛素材库一样管理校园活动照片。支持点击选择和拖拽上传，系统会在进入 AI 分析前完成数量、格式和大小校验。"
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <GlassCard title="选择活动类型" description="活动类型会影响相册故事线、九宫格编排和文案语气。">
            <div className="grid gap-3 md:grid-cols-3">
              {activityTypes.map((item) => {
                const meta = activityMeta[item];
                const Icon = meta.icon;
                const active = activityType === item;
                return (
                  <button
                    key={item}
                    type="button"
                    className={`focus-ring rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${
                      active ? "border-blue-500 bg-blue-50 shadow-soft" : "border-white/70 bg-white/70 hover:bg-white"
                    }`}
                    onClick={() => {
                      setActivityType(item);
                      setAnalyses([]);
                      setAlbum(null);
                    }}
                  >
                    <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${active ? "bg-blue-600 text-white" : "bg-slate-50 text-blue-700"}`}>
                      <Icon size={20} />
                    </div>
                    <div className="font-bold text-ink">{item}</div>
                    <div className="mt-1 text-sm leading-6 text-muted">{meta.desc}</div>
                  </button>
                );
              })}
            </div>
          </GlassCard>

          <GlassCard title="上传图片素材" description="最多 12 张，单张不超过 10 MB，支持 jpg / jpeg / png / webp。">
            <div
              className={`flex min-h-56 flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-10 text-center transition ${
                dragging ? "border-cyan-400 bg-cyan-50/80" : "border-blue-200 bg-blue-50/60 hover:border-blue-400"
              }`}
              onDragEnter={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                handleFiles(event.dataTransfer.files);
              }}
            >
              <UploadCloud className="text-blue-700" size={42} />
              <div className="mt-4 text-lg font-bold text-ink">拖拽图片到这里，或点击选择</div>
              <p className="mt-2 max-w-lg text-sm leading-6 text-muted">系统会保留原始文件名用于报告追溯，页面展示时会自动转为“照片 1 / 照片 2”。</p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <PrimaryButton type="button" onClick={() => inputRef.current?.click()}>
                  <ImagePlus size={18} />
                  选择图片
                </PrimaryButton>
                <input
                  ref={inputRef}
                  className="hidden"
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    handleFiles(event.target.files);
                    event.currentTarget.value = "";
                  }}
                />
              </div>
            </div>
          </GlassCard>

          <GlassCard title="素材质量建议" description="为了让 AI 相册更有叙事层次，建议素材覆盖以下类型。">
            <div className="grid gap-3 md:grid-cols-5">
              {["1 张封面", "2-3 张过程", "1-2 张人物", "1 张合影", "1 张细节"].map((item) => (
                <div key={item} className="rounded-2xl bg-blue-50 px-3 py-4 text-center text-sm font-bold text-blue-800">
                  {item}
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard
            title="素材预览"
            description="确认顺序、文件名和大小。后续 AI 分析会使用当前素材集合。"
            action={
              <div className="flex gap-2">
                <PrimaryButton variant="secondary" disabled={remaining <= 0} onClick={() => inputRef.current?.click()}>
                  继续添加
                </PrimaryButton>
                <PrimaryButton variant="ghost" disabled={localImages.length === 0} onClick={clearImages}>
                  全部清空
                </PrimaryButton>
              </div>
            }
          >
            {localImages.length === 0 ? (
              <EmptyState title="还没有素材" description="上传校园活动照片后，这里会显示缩略图、文件大小和删除操作。" />
            ) : (
              <ImageGrid
                items={localImages.map((image, index) => ({
                  id: image.id,
                  url: image.previewUrl,
                  alt: `素材 ${index + 1}`,
                  label: `照片 ${index + 1}`,
                  meta: `${image.file.name} · ${formatBytes(image.file.size)}`,
                  overlay: (
                    <button
                      type="button"
                      aria-label="删除图片"
                      className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 text-slate-700 shadow-sm transition hover:bg-red-50 hover:text-red-600"
                      onClick={() => removeImage(image.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  ),
                }))}
              />
            )}
          </GlassCard>
        </div>

        <aside className="space-y-4">
          <GlassCard title="素材摘要" description="为下一步 AI 分析准备素材状态。">
            <div className="grid gap-3">
              <MetricCard label="已上传" value={`${localImages.length} / ${MAX_FILES}`} icon={<Camera size={18} />} />
              <MetricCard label="剩余容量" value={remaining} hint="可继续添加图片数" />
              <MetricCard label="总大小" value={formatBytes(totalSize)} />
              <MetricCard label="活动类型" value={activityType} />
            </div>
            <div className="mt-4 rounded-2xl bg-slate-950 p-4 text-sm leading-6 text-slate-100">
              下一步会对 {localImages.length || 0} 张图片进行场景、情绪、视觉焦点和九宫格用途分析。
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex flex-col gap-3">
              <PrimaryButton disabled={localImages.length === 0} onClick={() => navigate("/analysis")}>
                进入 AI 分析
                <ArrowRight size={18} />
              </PrimaryButton>
              <PrimaryButton variant="secondary" onClick={openDemoProject}>
                加载演示项目
              </PrimaryButton>
              <PrimaryButton variant="secondary" disabled={localImages.length === 0} onClick={clearImages}>
                清空素材
              </PrimaryButton>
              <Link to="/">
                <PrimaryButton variant="ghost" className="w-full">
                  <ArrowLeft size={18} />
                  返回首页
                </PrimaryButton>
              </Link>
            </div>
          </GlassCard>
        </aside>
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 MB";
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

import { ArrowRight, ImagePlus, Trash2, UploadCloud } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { PrimaryButton } from "../components/PrimaryButton";
import { useAppState } from "../context/AppContext";
import { activityTypes, type LocalImage } from "../types";

const MAX_FILES = 12;
const MAX_SIZE = 10 * 1024 * 1024;
const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

export function UploadPage() {
  const navigate = useNavigate();
  const { activityType, setActivityType, localImages, setLocalImages, setAnalyses, setAlbum } = useAppState();
  const [message, setMessage] = useState("");

  const remaining = MAX_FILES - localImages.length;
  const previews = useMemo(() => localImages, [localImages]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const nextFiles = Array.from(files);
    const errors: string[] = [];
    const accepted: LocalImage[] = [];

    if (localImages.length + nextFiles.length > MAX_FILES) {
      errors.push(`最多支持 ${MAX_FILES} 张图片，本次还可添加 ${remaining} 张。`);
    }

    for (const file of nextFiles.slice(0, Math.max(remaining, 0))) {
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name} 格式不支持，仅支持 jpg、jpeg、png、webp。`);
        continue;
      }
      if (file.size > MAX_SIZE) {
        errors.push(`${file.name} 超过 10 MB。`);
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
    }
    setMessage(errors[0] || (accepted.length > 0 ? `已添加 ${accepted.length} 张图片。` : ""));
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
    setMessage("已清空上传图片。");
  };

  return (
    <div>
      <PageHeader
        eyebrow="Step 01 / Upload"
        title="上传校园活动照片"
        description="选择活动类型后上传 1-12 张图片。Demo 会先在浏览器中预览图片，再提交给后端 mock AI 分析。"
      />

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-lg border border-white bg-white/90 p-5 shadow-sm">
          <label className="text-sm font-semibold text-slate-700" htmlFor="activity-type">
            活动类型
          </label>
          <select
            id="activity-type"
            className="focus-ring mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-slate-800"
            value={activityType}
            onChange={(event) => {
              setActivityType(event.target.value as typeof activityType);
              setAnalyses([]);
              setAlbum(null);
            }}
          >
            {activityTypes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-blue-200 bg-blue-50/70 px-5 py-10 text-center transition hover:border-blue-400 hover:bg-blue-50">
            <UploadCloud className="text-blue-700" size={38} />
            <span className="mt-3 text-base font-bold text-slate-800">点击选择图片</span>
            <span className="mt-2 text-sm leading-6 text-muted">最多 12 张，单张不超过 10 MB，支持 jpg / jpeg / png / webp</span>
            <input
              className="hidden"
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={(event) => {
                handleFiles(event.target.files);
                event.currentTarget.value = "";
              }}
            />
          </label>

          {message && <div className="mt-4 rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-700">{message}</div>}

          <div className="mt-5 flex flex-wrap gap-3">
            <PrimaryButton disabled={localImages.length === 0} onClick={() => navigate("/analysis")}>
              进入 AI 分析
              <ArrowRight size={18} />
            </PrimaryButton>
            <PrimaryButton variant="secondary" disabled={localImages.length === 0} onClick={clearImages}>
              清空
            </PrimaryButton>
          </div>
        </section>

        <section className="rounded-lg border border-white bg-white/90 p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-ink">图片预览</h2>
              <p className="text-sm text-muted">已选择 {localImages.length} / {MAX_FILES} 张</p>
            </div>
            <ImagePlus className="text-blue-700" />
          </div>

          {previews.length === 0 ? (
            <div className="flex min-h-64 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-sm text-muted">
              还没有上传图片
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {previews.map((image, index) => (
                <figure key={image.id} className="group relative overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                  <img src={image.previewUrl} alt={`上传预览 ${index + 1}`} className="aspect-[4/3] w-full object-cover" />
                  <figcaption className="truncate px-3 py-2 text-xs text-slate-600">{image.file.name}</figcaption>
                  <button
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-slate-700 shadow-sm transition hover:bg-red-50 hover:text-red-600"
                    type="button"
                    aria-label="删除图片"
                    onClick={() => removeImage(image.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </figure>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

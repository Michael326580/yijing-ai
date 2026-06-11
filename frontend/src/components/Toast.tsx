import { CheckCircle2, Info, XCircle } from "lucide-react";

export type ToastTone = "success" | "error" | "info";

interface ToastProps {
  message: string;
  tone?: ToastTone;
  onClose?: () => void;
}

const styles: Record<ToastTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-red-200 bg-red-50 text-red-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
};

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

export function Toast({ message, tone = "info", onClose }: ToastProps) {
  if (!message) return null;
  const Icon = icons[tone];
  return (
    <div className={`fixed right-4 top-20 z-50 flex max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-medium shadow-soft ${styles[tone]}`}>
      <Icon size={18} className="mt-0.5 shrink-0" />
      <span className="leading-6">{message}</span>
      {onClose && (
        <button type="button" className="ml-1 text-xs opacity-70 hover:opacity-100" onClick={onClose}>
          关闭
        </button>
      )}
    </div>
  );
}

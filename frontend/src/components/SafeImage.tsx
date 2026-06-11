import { ImageOff } from "lucide-react";
import { useState } from "react";

interface SafeImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

export function SafeImage({ src, alt, className = "", fallbackClassName = "" }: SafeImageProps) {
  const [failed, setFailed] = useState(false);
  const showFallback = !src || failed;

  if (showFallback) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={[
          "flex items-center justify-center bg-gradient-to-br from-blue-50 via-slate-100 to-violet-50 text-slate-400",
          className,
          fallbackClassName,
        ].join(" ")}
      >
        <div className="flex flex-col items-center gap-2 text-xs font-bold">
          <ImageOff size={22} />
          图片暂不可用
        </div>
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} loading="lazy" />;
}

import type { ReactNode } from "react";

interface GlassCardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export function GlassCard({ title, description, children, className = "", action }: GlassCardProps) {
  return (
    <section className={`rounded-2xl border border-white/60 bg-white/78 p-5 shadow-soft backdrop-blur-xl transition hover:border-blue-100 ${className}`}>
      {(title || description || action) && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="text-lg font-bold text-ink">{title}</h2>}
            {description && <p className="mt-1 text-sm leading-6 text-muted">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

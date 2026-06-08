import type { ButtonHTMLAttributes, ReactNode } from "react";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
}

export function PrimaryButton({ children, className = "", variant = "primary", ...props }: PrimaryButtonProps) {
  const styles = {
    primary: "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-soft hover:from-blue-700 hover:to-violet-700",
    secondary: "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
    ghost: "bg-transparent text-slate-700 hover:bg-white",
  };

  return (
    <button
      className={[
        "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        styles[variant],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}

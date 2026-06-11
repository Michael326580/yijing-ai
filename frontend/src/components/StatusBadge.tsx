interface StatusBadgeProps {
  label: string;
  tone?: "blue" | "green" | "amber" | "red" | "slate" | "violet" | "cyan";
}

const tones: Record<NonNullable<StatusBadgeProps["tone"]>, string> = {
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  red: "border-red-200 bg-red-50 text-red-700",
  slate: "border-slate-200 bg-slate-50 text-slate-700",
  violet: "border-violet-200 bg-violet-50 text-violet-700",
  cyan: "border-cyan-200 bg-cyan-50 text-cyan-700",
};

export function StatusBadge({ label, tone = "slate" }: StatusBadgeProps) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${tones[tone]}`}>{label}</span>;
}

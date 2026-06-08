interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="mb-2 text-sm font-semibold text-blue-700">{eyebrow}</div>
      <h1 className="text-3xl font-bold tracking-normal text-ink md:text-4xl">{title}</h1>
      <p className="mt-3 max-w-3xl text-base leading-7 text-muted">{description}</p>
    </div>
  );
}

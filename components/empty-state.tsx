export function EmptyState({ emoji, title, description, children }: {
  emoji: string; title: string; description?: string; children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-14 text-center">
      <div className="mb-3 text-4xl">{emoji}</div>
      <h3 className="text-base font-medium">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {children && <div className="mt-4 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  );
}

// Skeleton hiện ngay khi chuyển trang (Next stream phần còn lại) -> cảm giác tức thì
export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-8 sm:px-8">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />)}
      </div>
    </div>
  );
}

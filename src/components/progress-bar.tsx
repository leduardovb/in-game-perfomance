export function ProgressBar({ ratio, label }: { ratio: number; label: string }) {
  const percent = Math.round(Math.min(Math.max(ratio, 0), 1) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className="h-2 w-full overflow-hidden rounded-full bg-border"
    >
      <div
        className={`h-full rounded-full transition-[width] ${percent === 100 ? "bg-success" : "bg-accent"}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

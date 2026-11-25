export function StatTile({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-lg font-semibold">
        {value}
        {detail && <span className="ml-1.5 text-xs font-normal text-muted">{detail}</span>}
      </dd>
    </div>
  );
}

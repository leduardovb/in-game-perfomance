import Link from "next/link";

export type FilterChip = { href: string; label: string; active: boolean };

export function FilterChips({ label, chips }: { label: string; chips: FilterChip[] }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {chips.map((chip) => (
        <Link
          key={chip.href}
          href={chip.href}
          aria-current={chip.active ? "true" : undefined}
          className="rounded-full border border-border px-3 py-1.5 text-sm aria-[current=true]:border-accent aria-[current=true]:bg-accent aria-[current=true]:text-accent-foreground"
        >
          {chip.label}
        </Link>
      ))}
    </div>
  );
}

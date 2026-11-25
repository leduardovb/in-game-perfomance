"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Treinos", isActive: (path: string) => path === "/" || path.startsWith("/treino") },
  { href: "/desempenho/lol", label: "LoL", isActive: (path: string) => path.startsWith("/desempenho/lol") },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="-mt-1 mb-5 flex gap-5 border-b border-border text-sm">
      {LINKS.map((link) => {
        const active = link.isActive(pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px border-b-2 pb-2 ${
              active ? "border-accent font-medium text-foreground" : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

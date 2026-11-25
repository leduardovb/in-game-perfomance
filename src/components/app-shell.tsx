import Link from "next/link";
import type { ReactNode } from "react";
import { logoutAction } from "@/lib/auth/actions";
import { NavLinks } from "./nav-links";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col px-4 pb-12">
      <header className="flex items-center justify-between gap-4 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          In-Game Performance
        </Link>
        <form action={logoutAction}>
          <button type="submit" className="text-sm text-muted hover:text-foreground">
            Sair
          </button>
        </form>
      </header>
      <NavLinks />
      <main className="flex flex-col gap-6">{children}</main>
    </div>
  );
}

import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">In-Game Performance</h1>
        <p className="mt-1 text-sm text-muted">Digite a senha para continuar.</p>
      </div>
      <LoginForm />
    </main>
  );
}

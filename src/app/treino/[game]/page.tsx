import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { StartTrainingForm } from "@/components/training/start-training-form";
import { TrainingChecklist } from "@/components/training/training-checklist";
import { requireAuth } from "@/lib/auth/auth";
import { formatIsoDate } from "@/lib/date";
import { GAME_LABELS, isGame } from "@/lib/games";
import { getTrainingService } from "@/modules/training";
import { getTemplate, listLolTemplates } from "@/modules/training/domain/templates";

export async function generateMetadata({ params }: PageProps<"/treino/[game]">): Promise<Metadata> {
  const { game } = await params;
  return { title: isGame(game) ? `Treino ${GAME_LABELS[game]}` : "Treino" };
}

export default async function TrainingPage({ params }: PageProps<"/treino/[game]">) {
  const { game } = await params;
  if (!isGame(game)) notFound();
  await requireAuth();

  const service = getTrainingService();
  const session = await service.getTodaySession(game);
  const templates = game === "lol" ? listLolTemplates() : [getTemplate(game, null)];

  return (
    <AppShell>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-sm text-muted">{formatIsoDate(service.today())}</p>
          <h1 className="text-xl font-semibold">Treino de {GAME_LABELS[game]}</h1>
        </div>
        <Link href={`/treino/${game}/historico`} className="text-sm text-accent">
          Histórico
        </Link>
      </div>
      {session ? (
        <TrainingChecklist session={session} />
      ) : (
        <StartTrainingForm game={game} templates={templates} />
      )}
    </AppShell>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ProgressBar } from "@/components/progress-bar";
import { requireAuth } from "@/lib/auth/auth";
import { formatIsoDate } from "@/lib/date";
import { GAME_LABELS, LOL_ROLE_LABELS, isGame } from "@/lib/games";
import { getTrainingService } from "@/modules/training";
import { getProgress } from "@/modules/training/domain/session";
import { HISTORY_DAYS } from "@/modules/training/service";

export async function generateMetadata({ params }: PageProps<"/treino/[game]/historico">): Promise<Metadata> {
  const { game } = await params;
  return { title: isGame(game) ? `Histórico ${GAME_LABELS[game]}` : "Histórico" };
}

export default async function TrainingHistoryPage({ params }: PageProps<"/treino/[game]/historico">) {
  const { game } = await params;
  if (!isGame(game)) notFound();
  await requireAuth();

  const { sessions, streak } = await getTrainingService().getHistory(game);
  const completedCount = sessions.filter((session) => getProgress(session).isComplete).length;

  return (
    <AppShell>
      <div className="flex items-end justify-between gap-2">
        <h1 className="text-xl font-semibold">Histórico de {GAME_LABELS[game]}</h1>
        <Link href={`/treino/${game}`} className="text-sm text-accent">
          Treino de hoje
        </Link>
      </div>

      <dl className="grid grid-cols-2 gap-3">
        <Stat label="Sequência atual" value={`${streak} ${streak === 1 ? "dia" : "dias"}`} />
        <Stat label={`Concluídos (${HISTORY_DAYS} dias)`} value={String(completedCount)} />
      </dl>

      {sessions.length === 0 ? (
        <p className="text-sm text-muted">Nenhum treino nos últimos {HISTORY_DAYS} dias.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sessions.map((session) => {
            const progress = getProgress(session);
            return (
              <li key={session.id} className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium">
                    {formatIsoDate(session.date)}
                    {session.role && <span className="ml-2 text-muted">{LOL_ROLE_LABELS[session.role]}</span>}
                  </span>
                  <span className={progress.isComplete ? "text-success" : "text-muted"}>
                    {progress.isComplete
                      ? "Concluído"
                      : `${progress.completedSteps}/${progress.totalSteps} etapas · ${progress.matchesPlayed}/${progress.matchesTarget} partidas`}
                  </span>
                </div>
                <ProgressBar ratio={progress.ratio} label={`Progresso em ${formatIsoDate(session.date)}`} />
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-lg font-semibold">{value}</dd>
    </div>
  );
}

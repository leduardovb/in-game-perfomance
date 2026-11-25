import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ProgressBar } from "@/components/progress-bar";
import { requireAuth } from "@/lib/auth/auth";
import { GAMES, GAME_LABELS, LOL_ROLE_LABELS, type Game } from "@/lib/games";
import { getTrainingService } from "@/modules/training";
import { getProgress } from "@/modules/training/domain/session";

export default async function HomePage() {
  await requireAuth();
  const service = getTrainingService();
  const today = service.today();
  const histories = await Promise.all(GAMES.map((game) => service.getHistory(game)));

  return (
    <AppShell>
      <section className="flex flex-col gap-3">
        <h1 className="text-xl font-semibold">Treino de hoje</h1>
        {GAMES.map((game, index) => {
          const { sessions, streak } = histories[index];
          const todaySession = sessions.find((session) => session.date === today) ?? null;
          return (
            <GameCard
              key={game}
              game={game}
              streak={streak}
              summary={
                todaySession
                  ? {
                      progress: getProgress(todaySession),
                      roleLabel: todaySession.role ? LOL_ROLE_LABELS[todaySession.role] : null,
                    }
                  : null
              }
            />
          );
        })}
      </section>
    </AppShell>
  );
}

type GameCardProps = {
  game: Game;
  streak: number;
  summary: { progress: ReturnType<typeof getProgress>; roleLabel: string | null } | null;
};

function GameCard({ game, streak, summary }: GameCardProps) {
  return (
    <Link
      href={`/treino/${game}`}
      className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-semibold">
          {GAME_LABELS[game]}
          {summary?.roleLabel && <span className="ml-2 text-sm font-normal text-muted">{summary.roleLabel}</span>}
        </h2>
        <span className="text-sm text-muted">
          {streak > 0 ? `${streak} ${streak === 1 ? "dia" : "dias"} seguidos` : "Sem sequência"}
        </span>
      </div>
      {summary ? (
        <>
          <ProgressBar ratio={summary.progress.ratio} label={`Progresso do treino de ${GAME_LABELS[game]}`} />
          <p className="text-sm text-muted">
            {summary.progress.isComplete
              ? "Treino concluído 🎯"
              : `${summary.progress.completedSteps}/${summary.progress.totalSteps} etapas · ${summary.progress.matchesPlayed}/${summary.progress.matchesTarget} partidas`}
          </p>
        </>
      ) : (
        <p className="text-sm text-accent">Iniciar treino →</p>
      )}
    </Link>
  );
}

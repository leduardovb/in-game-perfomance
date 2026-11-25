import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { StatTile } from "@/components/performance/stat-tile";
import { SyncButton } from "@/components/performance/sync-button";
import { TrendGrid, type TrendMetric } from "@/components/performance/trend-grid";
import { requireAuth } from "@/lib/auth/auth";
import { shortDateFormatter, type DateFormatter } from "@/lib/date";
import { getEnv } from "@/lib/env";
import { formatValue } from "@/lib/format";
import { getCs2Service } from "@/modules/cs2";
import { syncFaceitMatchesAction } from "@/modules/cs2/actions";
import { kdRatio } from "@/modules/cs2/domain/stats";
import { CS2_SOURCE_LABELS, type Cs2Match } from "@/modules/cs2/domain/types";

export const metadata: Metadata = { title: "Desempenho CS2" };

const TREND_WINDOW = 5;
const LIST_LIMIT = 20;

const TREND_METRICS: TrendMetric<Cs2Match>[] = [
  { title: "Winrate", format: "percent", value: (match) => (match.win ? 1 : 0) },
  { title: "K/D", format: "decimal", value: kdRatio },
  { title: "ADR", format: "integer", value: (match) => match.adr },
  { title: "HS%", format: "percent", value: (match) => match.headshotRate },
];

/** "de_mirage" → "Mirage". */
function mapLabel(map: string): string {
  const name = map.replace(/^de_/, "");
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export default async function Cs2PerformancePage() {
  await requireAuth();
  const service = getCs2Service();

  if (!service) {
    return (
      <AppShell>
        <h1 className="text-xl font-semibold">Desempenho no CS2</h1>
        <p className="text-sm text-muted">
          Configure a variável <code>FACEIT_NICKNAME</code> para acompanhar suas partidas da FACEIT.
        </p>
      </AppShell>
    );
  }

  const env = getEnv();
  const formatDate = shortDateFormatter(env.APP_TIMEZONE);
  const { matches, summary } = await service.getOverview();

  return (
    <AppShell>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Desempenho no CS2</h1>
          <p className="text-sm text-muted">FACEIT · {env.FACEIT_NICKNAME}</p>
        </div>
        {service.isSyncEnabled ? (
          <SyncButton action={syncFaceitMatchesAction} />
        ) : (
          <p className="max-w-40 text-right text-xs text-muted">Configure FACEIT_API_KEY para sincronizar.</p>
        )}
      </div>

      {!summary ? (
        <p className="text-sm text-muted">
          Nenhuma partida salva ainda.
          {service.isSyncEnabled && " Use “Atualizar partidas” para buscar as mais recentes."}
        </p>
      ) : (
        <>
          <section aria-labelledby="summary-title" className="flex flex-col gap-2">
            <h2 id="summary-title" className="text-sm text-muted">
              Últimas {summary.matches} partidas
            </h2>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile
                label="Winrate"
                value={formatValue(summary.winRate, "percent")}
                detail={`${summary.wins}V ${summary.matches - summary.wins}D`}
              />
              <StatTile label="K/D" value={formatValue(summary.kdRatio, "decimal")} />
              <StatTile label="ADR" value={formatValue(summary.adr, "integer")} />
              <StatTile label="HS%" value={formatValue(summary.headshotRate, "percent")} />
            </dl>
          </section>

          <TrendGrid matches={matches} metrics={TREND_METRICS} window={TREND_WINDOW} formatDate={formatDate} />

          <section aria-labelledby="matches-title" className="flex flex-col gap-2">
            <h2 id="matches-title" className="text-sm text-muted">
              Partidas recentes
            </h2>
            <ul className="flex flex-col gap-2">
              {matches.slice(0, LIST_LIMIT).map((match) => (
                <MatchRow key={`${match.source}:${match.matchId}`} match={match} formatDate={formatDate} />
              ))}
            </ul>
          </section>
        </>
      )}
    </AppShell>
  );
}

function MatchRow({ match, formatDate }: { match: Cs2Match; formatDate: DateFormatter }) {
  return (
    <li
      className={`flex items-center justify-between gap-3 rounded-xl border-l-4 bg-surface p-3 text-sm ${
        match.win ? "border-l-success" : "border-l-danger"
      }`}
    >
      <div className="min-w-0">
        <p className="truncate font-medium">
          {mapLabel(match.map)}
          {match.score && <span className="ml-2 font-normal text-muted">{match.score}</span>}
        </p>
        <p className="text-xs text-muted">
          {match.win ? "Vitória" : "Derrota"} · {CS2_SOURCE_LABELS[match.source]} · {formatDate(match.playedAt)}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-medium tabular-nums">
          {match.kills}/{match.deaths}/{match.assists}
        </p>
        <p className="text-xs tabular-nums text-muted">
          {formatValue(match.adr, "integer")} ADR · {formatValue(match.headshotRate, "percent")} HS
        </p>
      </div>
    </li>
  );
}

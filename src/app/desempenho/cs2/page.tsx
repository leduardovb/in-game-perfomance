import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { FilterChips } from "@/components/performance/filter-chips";
import { StatTile } from "@/components/performance/stat-tile";
import { SyncButton } from "@/components/performance/sync-button";
import { TrendGrid, type TrendMetric } from "@/components/performance/trend-grid";
import { requireAuth } from "@/lib/auth/auth";
import { shortDateFormatter, type DateFormatter } from "@/lib/date";
import { getEnv } from "@/lib/env";
import { formatValue } from "@/lib/format";
import { logger } from "@/lib/logger";
import { getCs2Service, getPremierService } from "@/modules/cs2";
import { syncFaceitMatchesAction } from "@/modules/cs2/actions";
import { kdRatio } from "@/modules/cs2/domain/stats";
import { CS2_SOURCE_LABELS, type Cs2Match } from "@/modules/cs2/domain/types";
import { LeetifyApiError } from "@/modules/cs2/leetify/leetify-client";
import type { Cs2Overview } from "@/modules/cs2/service";

export const metadata: Metadata = { title: "Desempenho CS2" };

const TREND_WINDOW = 5;
const LIST_LIMIT = 20;

const TREND_METRICS: TrendMetric<Cs2Match>[] = [
  { title: "Winrate", format: "percent", value: (match) => (match.win ? 1 : 0) },
  { title: "K/D", format: "decimal", value: kdRatio },
  { title: "ADR", format: "integer", value: (match) => match.adr },
  { title: "HS%", format: "percent", value: (match) => match.headshotRate },
];

const VIEWS = ["faceit", "premier"] as const;
type View = (typeof VIEWS)[number];
const VIEW_LABELS: Record<View, string> = { faceit: "FACEIT", premier: "Premier/MM" };

/** "de_mirage" → "Mirage". */
function mapLabel(map: string): string {
  const name = map.replace(/^de_/, "");
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export default async function Cs2PerformancePage({ searchParams }: PageProps<"/desempenho/cs2">) {
  await requireAuth();
  const env = getEnv();
  const formatDate = shortDateFormatter(env.APP_TIMEZONE);
  const { fonte } = await searchParams;
  const requested = VIEWS.find((option) => option === fonte);
  const view: View = requested ?? (env.FACEIT_NICKNAME || !env.LEETIFY_STEAM64_ID ? "faceit" : "premier");

  return (
    <AppShell>
      <h1 className="text-xl font-semibold">Desempenho no CS2</h1>
      <FilterChips
        label="Fonte das partidas"
        chips={VIEWS.map((option) => ({
          href: `/desempenho/cs2?fonte=${option}`,
          label: VIEW_LABELS[option],
          active: option === view,
        }))}
      />
      {view === "faceit" ? <FaceitView formatDate={formatDate} /> : <PremierView formatDate={formatDate} />}
    </AppShell>
  );
}

async function FaceitView({ formatDate }: { formatDate: DateFormatter }) {
  const service = getCs2Service();
  if (!service) {
    return <Notice>Configure a variável <code>FACEIT_NICKNAME</code> para acompanhar suas partidas da FACEIT.</Notice>;
  }
  const overview = await service.getOverview();

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted">{getEnv().FACEIT_NICKNAME}</p>
        {service.isSyncEnabled ? (
          <SyncButton action={syncFaceitMatchesAction} />
        ) : (
          <p className="max-w-40 text-right text-xs text-muted">Configure FACEIT_API_KEY para sincronizar.</p>
        )}
      </div>
      <Overview
        overview={overview}
        formatDate={formatDate}
        empty={`Nenhuma partida salva ainda.${service.isSyncEnabled ? " Use “Atualizar partidas” para buscar as mais recentes." : ""}`}
      />
    </>
  );
}

async function PremierView({ formatDate }: { formatDate: DateFormatter }) {
  const service = getPremierService();
  if (!service) {
    return <Notice>Configure a variável <code>LEETIFY_STEAM64_ID</code> para ver suas partidas de Premier e matchmaking.</Notice>;
  }

  let overview: Cs2Overview;
  try {
    overview = await service.getOverview();
  } catch (error) {
    if (error instanceof LeetifyApiError) {
      logger.warn("cs2.leetify_overview_rejected", { status: error.status });
      return <Notice tone="error">{error.message}</Notice>;
    }
    logger.error("cs2.leetify_overview_failed", { error });
    return <Notice tone="error">Não foi possível carregar as partidas do Leetify. Tente novamente em instantes.</Notice>;
  }

  return (
    <>
      <p className="text-sm text-muted">
        Partidas que o Leetify lista agora. Elas não são salvas no app, por regra do Leetify, então a evolução cobre só
        esse período.
      </p>
      <Overview overview={overview} formatDate={formatDate} empty="O Leetify não tem partidas recentes de Premier ou matchmaking." />
      <LeetifyAttribution steam64Id={service.steam64Id} />
    </>
  );
}

function Overview({ overview, formatDate, empty }: { overview: Cs2Overview; formatDate: DateFormatter; empty: string }) {
  const { matches, summary } = overview;
  if (!summary) return <Notice>{empty}</Notice>;

  return (
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
  );
}

/** Attribution required by Leetify's developer guidelines. */
function LeetifyAttribution({ steam64Id }: { steam64Id: string }) {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-sm">
      <a href="https://leetify.com/" target="_blank" rel="noopener noreferrer" className="text-muted">
        Data Provided by Leetify
      </a>
      <a
        href={`https://leetify.com/app/profile/${steam64Id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-bold text-[#F84982] underline"
      >
        View on Leetify
      </a>
    </footer>
  );
}

function Notice({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "error" }) {
  return (
    <p role={tone === "error" ? "alert" : undefined} className={`text-sm ${tone === "error" ? "text-danger" : "text-muted"}`}>
      {children}
    </p>
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

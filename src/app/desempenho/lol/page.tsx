import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { TrendChart } from "@/components/charts/trend-chart";
import { SyncButton } from "@/components/lol/sync-button";
import { requireAuth } from "@/lib/auth/auth";
import { getEnv } from "@/lib/env";
import { formatValue, type ValueFormat } from "@/lib/format";
import { getLolService } from "@/modules/lol";
import { csPerMinute, damagePerMinute, kda, rollingAverage } from "@/modules/lol/domain/stats";
import {
  MATCH_FILTERS,
  MATCH_FILTER_LABELS,
  QUEUE_LABELS,
  type LolMatch,
  type MatchFilter,
} from "@/modules/lol/domain/types";

export const metadata: Metadata = { title: "Desempenho LoL" };

/** Matches averaged into each point of the evolution charts. */
const TREND_WINDOW = 5;
const LIST_LIMIT = 20;

const POSITION_LABELS: Record<string, string> = {
  TOP: "Top",
  JUNGLE: "Jungle",
  MIDDLE: "Mid",
  BOTTOM: "ADC",
  UTILITY: "Suporte",
};

type DateFormatter = (date: Date) => string;

function shortDateFormatter(timeZone: string): DateFormatter {
  const format = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone });
  return (date) => format.format(date);
}

function parseFilter(value: string | string[] | undefined): MatchFilter {
  return MATCH_FILTERS.find((filter) => filter === value) ?? "solo";
}

export default async function LolPerformancePage({ searchParams }: PageProps<"/desempenho/lol">) {
  await requireAuth();
  const filter = parseFilter((await searchParams).fila);
  const service = getLolService();

  if (!service) {
    return (
      <AppShell>
        <h1 className="text-xl font-semibold">Desempenho no LoL</h1>
        <p className="text-sm text-muted">
          Configure a variável <code>RIOT_ID</code> (ex.: Nome#TAG) para acompanhar suas partidas.
        </p>
      </AppShell>
    );
  }

  const { matches, summary } = await service.getOverview(filter);
  const env = getEnv();
  const formatDate = shortDateFormatter(env.APP_TIMEZONE);
  const trend = (metric: (match: LolMatch) => number) =>
    rollingAverage(matches, metric, TREND_WINDOW).map((point) => ({
      label: formatDate(point.playedAt),
      value: point.value,
    }));

  const charts: { title: string; format: ValueFormat; metric: (match: LolMatch) => number }[] = [
    { title: "Winrate", format: "percent", metric: (match) => (match.win ? 1 : 0) },
    { title: "KDA", format: "decimal", metric: kda },
    { title: "CS por minuto", format: "decimal", metric: csPerMinute },
    { title: "Dano por minuto", format: "integer", metric: damagePerMinute },
  ];

  return (
    <AppShell>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Desempenho no LoL</h1>
          <p className="text-sm text-muted">
            {env.RIOT_ID} · {env.RIOT_PLATFORM.toUpperCase()}
          </p>
        </div>
        {service.isSyncEnabled ? (
          <SyncButton />
        ) : (
          <p className="max-w-40 text-right text-xs text-muted">Configure RIOT_API_KEY para sincronizar.</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filas">
        {MATCH_FILTERS.map((option) => (
          <Link
            key={option}
            href={`/desempenho/lol?fila=${option}`}
            aria-current={option === filter ? "true" : undefined}
            className="rounded-full border border-border px-3 py-1.5 text-sm aria-[current=true]:border-accent aria-[current=true]:bg-accent aria-[current=true]:text-accent-foreground"
          >
            {MATCH_FILTER_LABELS[option]}
          </Link>
        ))}
      </div>

      {!summary ? (
        <p className="text-sm text-muted">
          Nenhuma partida salva nesta fila ainda.
          {service.isSyncEnabled && " Use “Atualizar partidas” para buscar as mais recentes."}
        </p>
      ) : (
        <>
          <section aria-labelledby="summary-title" className="flex flex-col gap-2">
            <h2 id="summary-title" className="text-sm text-muted">
              Últimas {summary.matches} partidas
            </h2>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Winrate" value={formatValue(summary.winRate, "percent")} detail={`${summary.wins}V ${summary.matches - summary.wins}D`} />
              <Stat label="KDA" value={formatValue(summary.kda, "decimal")} />
              <Stat label="CS/min" value={formatValue(summary.csPerMinute, "decimal")} />
              <Stat label="Dano/min" value={formatValue(summary.damagePerMinute, "integer")} />
            </dl>
          </section>

          <section aria-labelledby="trend-title" className="flex flex-col gap-2">
            <h2 id="trend-title" className="text-sm text-muted">
              Evolução (média das últimas {TREND_WINDOW} partidas)
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {charts.map((chart) => (
                <TrendChart key={chart.title} title={chart.title} format={chart.format} points={trend(chart.metric)} />
              ))}
            </div>
          </section>

          <section aria-labelledby="matches-title" className="flex flex-col gap-2">
            <h2 id="matches-title" className="text-sm text-muted">
              Partidas recentes
            </h2>
            <ul className="flex flex-col gap-2">
              {matches.slice(0, LIST_LIMIT).map((match) => (
                <MatchRow key={match.matchId} match={match} formatDate={formatDate} />
              ))}
            </ul>
          </section>
        </>
      )}
    </AppShell>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail?: string }) {
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

function MatchRow({ match, formatDate }: { match: LolMatch; formatDate: DateFormatter }) {
  const minutes = Math.floor(match.durationSeconds / 60);
  return (
    <li
      className={`flex items-center justify-between gap-3 rounded-xl border-l-4 bg-surface p-3 text-sm ${
        match.win ? "border-l-success" : "border-l-danger"
      }`}
    >
      <div className="min-w-0">
        <p className="truncate font-medium">
          {match.champion}
          <span className="ml-2 font-normal text-muted">{POSITION_LABELS[match.position] ?? ""}</span>
        </p>
        <p className="text-xs text-muted">
          {match.win ? "Vitória" : "Derrota"} · {QUEUE_LABELS[match.queueId] ?? "Outra"} · {minutes} min ·{" "}
          {formatDate(match.playedAt)}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-medium tabular-nums">
          {match.kills}/{match.deaths}/{match.assists}
        </p>
        <p className="text-xs tabular-nums text-muted">
          {formatValue(csPerMinute(match), "decimal")} CS/min · {formatValue(damagePerMinute(match), "integer")} dano/min
        </p>
      </div>
    </li>
  );
}

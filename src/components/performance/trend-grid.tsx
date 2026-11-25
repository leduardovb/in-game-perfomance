import { TrendChart } from "@/components/charts/trend-chart";
import type { DateFormatter } from "@/lib/date";
import type { ValueFormat } from "@/lib/format";
import { rollingAverage } from "@/lib/trend";

export type TrendMetric<T> = { title: string; format: ValueFormat; value: (match: T) => number };

type Props<T> = {
  matches: readonly T[];
  metrics: TrendMetric<T>[];
  window: number;
  formatDate: DateFormatter;
};

/** One rolling-average chart per metric, computed on the server. */
export function TrendGrid<T extends { matchId: string; playedAt: Date }>({ matches, metrics, window, formatDate }: Props<T>) {
  return (
    <section aria-labelledby="trend-title" className="flex flex-col gap-2">
      <h2 id="trend-title" className="text-sm text-muted">
        Evolução (média das últimas {window} partidas)
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {metrics.map((metric) => (
          <TrendChart
            key={metric.title}
            title={metric.title}
            format={metric.format}
            points={rollingAverage(matches, metric.value, window).map((point) => ({
              label: formatDate(point.playedAt),
              value: point.value,
            }))}
          />
        ))}
      </div>
    </section>
  );
}

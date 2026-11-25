export type ValueFormat = "percent" | "decimal" | "integer";

export function formatValue(value: number, format: ValueFormat): string {
  if (format === "percent") return `${Math.round(value * 100)}%`;
  if (format === "integer") return Math.round(value).toLocaleString("pt-BR");
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

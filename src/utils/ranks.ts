import { RankDataPoint, TimeRange } from "../types/domain";

export const formatRank = (rank: number | null | undefined) =>
  rank == null ? "—" : `#${rank.toLocaleString()}`;
export const formatChange = (change: number | null | undefined) =>
  change == null ? "—" : `${change > 0 ? "+" : ""}${change.toLocaleString()}`;

// Clamp the day when stepping from a 31-day month or leap day.
export function monthsBefore(date: string, months: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  const day = value.getUTCDate();
  value.setUTCDate(1);
  value.setUTCMonth(value.getUTCMonth() - months);
  const lastDay = new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 0),
  ).getUTCDate();
  value.setUTCDate(Math.min(day, lastDay));
  return value.toISOString().slice(0, 10);
}

export function rangeDates(
  histories: RankDataPoint[][],
  range: TimeRange,
): string[] {
  const dates = [
    ...new Set(histories.flatMap((h) => h.map((p) => p.date))),
  ].sort();
  if (!dates.length || range === "all") return dates;
  const cutoff = monthsBefore(
    dates[dates.length - 1],
    range === "6m" ? 6 : range === "1y" ? 12 : 36,
  );
  return dates.filter((d) => d >= cutoff);
}

export function changeAt(
  history: RankDataPoint[],
  months: number,
): number | null {
  const latest = history[history.length - 1];
  if (!latest || latest.rank == null) return null;
  const target = monthsBefore(latest.date, months);
  const previous = [...history].reverse().find((p) => p.date <= target);
  // Never substitute an older ranked observation for an absent/missing snapshot.
  if (
    !previous ||
    previous.rank == null ||
    Date.parse(target) - Date.parse(previous.date) > 31 * 86400000
  )
    return null;
  return previous.rank - latest.rank;
}

export function mergeHistory(
  archive: RankDataPoint[],
  recent: RankDataPoint[],
): RankDataPoint[] {
  const byDate = new Map(archive.map((p) => [p.date, p]));
  for (const point of recent) {
    const old = byDate.get(point.date);
    byDate.set(point.date, {
      ...old,
      ...point,
      listId: point.listId || old?.listId,
    });
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

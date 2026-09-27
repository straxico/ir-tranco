import React, { useMemo, useState } from "react";
import { DomainItem, TimeRange } from "../types/domain";
import { formatRank, rangeDates } from "../utils/ranks";

interface Props {
  domains: DomainItem[];
  timeRange?: TimeRange;
  onTimeRangeChange?: (range: TimeRange) => void;
  height?: number;
  isPersian?: boolean;
}
const COLORS = ["#06b6d4", "#10b981", "#f59e0b", "#a855f7", "#f43f5e"];
export const RankChart: React.FC<Props> = ({
  domains,
  timeRange = "all",
  onTimeRangeChange,
  height = 320,
  isPersian = true,
}) => {
  const [internal, setInternal] = useState<TimeRange>(timeRange);
  const [hover, setHover] = useState<string | null>(null);
  const range = onTimeRangeChange ? timeRange : internal;
  const dates = useMemo(
    () =>
      rangeDates(
        domains.map((d) => d.history),
        range,
      ),
    [domains, range],
  );
  const series = useMemo(
    () =>
      domains.map((d) => ({
        domain: d,
        points: new Map(d.history.map((p) => [p.date, p])),
      })),
    [domains],
  );
  const ranks = series.flatMap((s) =>
    dates.flatMap((date) => {
      const rank = s.points.get(date)?.rank;
      return rank == null ? [] : [rank];
    }),
  );
  const min = ranks.length ? Math.min(...ranks) : 1;
  const max = ranks.length ? Math.max(...ranks) : 2;
  const left = 72,
    right = 780,
    top = 20,
    bottom = height - 42;
  const firstTime = Date.parse(dates[0] || "2000-01-01");
  const lastTime = Date.parse(dates[dates.length - 1] || "2000-01-01");
  const x = (date: string) =>
    firstTime === lastTime
      ? (left + right) / 2
      : left +
        ((Date.parse(date) - firstTime) / (lastTime - firstTime)) *
          (right - left);
  const y = (rank: number) =>
    min === max
      ? (top + bottom) / 2
      : top + ((rank - min) / (max - min)) * (bottom - top);
  const ticks = dates.filter(
    (_, i) =>
      i % Math.max(1, Math.ceil(dates.length / 6)) === 0 ||
      i === dates.length - 1,
  );
  return (
    <div className="space-y-3" dir="ltr">
      <div className="flex flex-wrap justify-between gap-3 text-xs">
        <div className="flex flex-wrap gap-3">
          {domains.map((d, i) => (
            <span key={d.domain} style={{ color: COLORS[i % COLORS.length] }}>
              {isPersian ? d.titleFa : d.titleEn}
            </span>
          ))}
        </div>
        <div className="flex gap-1">
          {(["6m", "1y", "3y", "all"] as TimeRange[]).map((r, i) => (
            <button
              key={r}
              onClick={() => {
                (onTimeRangeChange || setInternal)(r);
                setHover(null);
              }}
              className={`rounded px-3 py-1 ${r === range ? "bg-cyan-500/20 text-cyan-300" : "bg-slate-800 text-slate-400"}`}
            >
              {isPersian
                ? ["۶ ماه", "۱ سال", "۳ سال", "همه"][i]
                : ["6 months", "1 year", "3 years", "All"][i]}
            </button>
          ))}
        </div>
      </div>
      {!ranks.length ? (
        <div className="py-16 text-center text-sm text-slate-400">
          {isPersian
            ? "در این بازه رتبه‌ای ثبت نشده است."
            : "No ranked observations in this period."}
        </div>
      ) : (
        <svg
          viewBox={`0 0 800 ${height}`}
          className="w-full rounded-xl bg-slate-950/50"
          role="img"
          aria-label={
            isPersian
              ? "تاریخچه رتبه ترنکو؛ شکاف‌ها نشان‌دهنده نبود رتبه یا داده هستند"
              : "Tranco history; gaps indicate unranked or unavailable observations"
          }
          onMouseLeave={() => setHover(null)}
          onMouseMove={(e) => {
            const bounds = e.currentTarget.getBoundingClientRect();
            const px = ((e.clientX - bounds.left) / bounds.width) * 800;
            const nearest = dates.reduce(
              (best, d) =>
                Math.abs(x(d) - px) < Math.abs(x(best) - px) ? d : best,
              dates[0],
            );
            setHover(nearest);
          }}
        >
          {Array.from(
            { length: min === max ? 1 : 5 },
            (_, i) => min + ((max - min) * i) / 4,
          ).map((rank) => (
            <g key={rank}>
              <line
                x1={left}
                x2={right}
                y1={y(rank)}
                y2={y(rank)}
                stroke="#334155"
                strokeDasharray="3 5"
              />
              <text
                x={left - 8}
                y={y(rank) + 4}
                fill="#94a3b8"
                fontSize="10"
                textAnchor="end"
              >
                {Math.round(rank).toLocaleString()}
              </text>
            </g>
          ))}
          {ticks.map((date) => (
            <text
              key={date}
              x={x(date)}
              y={height - 14}
              textAnchor="middle"
              fontSize="10"
              fill="#94a3b8"
            >
              {date}
            </text>
          ))}
          {series.map((s, i) => {
            let connected = false;
            let path = "";
            for (const date of dates) {
              const point = s.points.get(date);
              if (point?.rank == null) {
                connected = false;
                continue;
              }
              path += `${connected ? "L" : "M"} ${x(date)} ${y(point.rank)} `;
              connected = true;
            }
            return (
              <g key={s.domain.domain}>
                <path
                  d={path}
                  fill="none"
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth="2"
                />
                {dates.map((date) => {
                  const rank = s.points.get(date)?.rank;
                  return rank == null ? null : (
                    <circle
                      key={date}
                      cx={x(date)}
                      cy={y(rank)}
                      r="2.3"
                      fill={COLORS[i % COLORS.length]}
                    />
                  );
                })}
              </g>
            );
          })}
          {hover && dates.includes(hover) && (
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={top}
              y2={bottom}
              stroke="#64748b"
              strokeDasharray="4 4"
            />
          )}
        </svg>
      )}
      {hover && dates.includes(hover) && (
        <div className="flex flex-wrap gap-4 text-xs text-slate-300">
          <strong>{hover}</strong>
          {series.map((s, i) => (
            <span
              key={s.domain.domain}
              style={{ color: COLORS[i % COLORS.length] }}
            >
              {s.domain.domain}: {formatRank(s.points.get(hover)?.rank)}
            </span>
          ))}
        </div>
      )}
      <p className="text-[11px] text-slate-400" dir={isPersian ? "rtl" : "ltr"}>
        {isPersian
          ? "آرشیو پایان ماه و رتبه‌های روزانه؛ میانگین ماهانه نیست. عدد کمتر بهتر است. شکاف‌ها یعنی خارج از فهرست یا داده ناموجود."
          : "Historical month-end and daily ranks, not monthly averages. Lower is better. Gaps mean unranked or unavailable data."}
      </p>
    </div>
  );
};

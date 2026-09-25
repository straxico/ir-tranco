import React, { useState, useMemo } from 'react';
import { DomainItem, TimeRange } from '../types/domain';

interface SeriesData {
  domain: string;
  label: string;
  color: string;
  points: { date: string; rank: number }[];
}

interface RankChartProps {
  domains: DomainItem[];
  timeRange?: TimeRange;
  onTimeRangeChange?: (range: TimeRange) => void;
  height?: number;
  isPersian?: boolean;
}

const PALETTE = [
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#a855f7', // Purple
  '#f43f5e', // Rose
];

export const RankChart: React.FC<RankChartProps> = ({
  domains,
  timeRange = 'all',
  onTimeRangeChange,
  height = 320,
  isPersian = true,
}) => {
  const [internalTimeRange, setInternalTimeRange] = useState<TimeRange>(timeRange);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const activeRange = onTimeRangeChange ? timeRange : internalTimeRange;
  const setRange = onTimeRangeChange || setInternalTimeRange;

  // Filter points based on selected time range
  const filteredSeries = useMemo(() => {
    return domains.map((d, idx) => {
      let pts = [...d.history];
      if (activeRange === '6m') pts = pts.slice(-6);
      else if (activeRange === '1y') pts = pts.slice(-12);
      else if (activeRange === '3y') pts = pts.slice(-36);

      return {
        domain: d.domain,
        label: isPersian ? d.titleFa : d.titleEn,
        color: PALETTE[idx % PALETTE.length],
        points: pts,
      };
    });
  }, [domains, activeRange, isPersian]);

  const dates = useMemo(() => {
    if (filteredSeries.length === 0 || !filteredSeries[0].points) return [];
    return filteredSeries[0].points.map((p) => p.date);
  }, [filteredSeries]);

  // Determine min and max rank for the Y axis
  // Remember: Inverted Y axis! Smaller rank number is BETTER and belongs at the top!
  const { minRank, maxRank } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;

    filteredSeries.forEach((s) => {
      s.points.forEach((p) => {
        if (p.rank < min) min = p.rank;
        if (p.rank > max) max = p.rank;
      });
    });

    if (min === Infinity) return { minRank: 1, maxRank: 100000 };

    // Add padding to bounds
    const span = max - min;
    const paddedMin = Math.max(1, Math.floor(min - span * 0.08));
    const paddedMax = Math.ceil(max + span * 0.08);

    return { minRank: paddedMin, maxRank: paddedMax };
  }, [filteredSeries]);

  // SVG dimensions
  const padding = { top: 20, right: 25, bottom: 35, left: 65 };
  const svgWidth = 800; // viewBox width
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Convert (index, rank) to (x, y) coordinates
  const getX = (index: number) => {
    if (dates.length <= 1) return padding.left;
    return padding.left + (index / (dates.length - 1)) * plotWidth;
  };

  const getY = (rank: number) => {
    if (maxRank === minRank) return padding.top + plotHeight / 2;
    // INVERTED: minRank (best) is at top (padding.top), maxRank is at bottom
    return padding.top + ((rank - minRank) / (maxRank - minRank)) * plotHeight;
  };

  // Build SVG smooth path strings
  const paths = useMemo(() => {
    return filteredSeries.map((series) => {
      if (series.points.length === 0) return { path: '', area: '' };

      const pts = series.points.map((p, i) => ({
        x: getX(i),
        y: getY(p.rank),
      }));

      // Line path
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1];
        const curr = pts[i];
        const cpX1 = prev.x + (curr.x - prev.x) / 3;
        const cpX2 = curr.x - (curr.x - prev.x) / 3;
        d += ` C ${cpX1} ${prev.y}, ${cpX2} ${curr.y}, ${curr.x} ${curr.y}`;
      }

      // Area path for single series
      const bottomY = padding.top + plotHeight;
      const area = `${d} L ${pts[pts.length - 1].x} ${bottomY} L ${pts[0].x} ${bottomY} Z`;

      return { path: d, area, pts };
    });
  }, [filteredSeries, minRank, maxRank, plotHeight, dates.length]);

  // Y-axis grid ticks
  const yTicks = useMemo(() => {
    const ticksCount = 5;
    const step = (maxRank - minRank) / (ticksCount - 1);
    return Array.from({ length: ticksCount }, (_, i) => {
      const val = Math.round(minRank + i * step);
      return {
        value: val,
        y: getY(val),
      };
    });
  }, [minRank, maxRank]);

  // X-axis date labels (show ~5 to 7 labels)
  const xTicks = useMemo(() => {
    if (dates.length === 0) return [];
    const step = Math.max(1, Math.floor(dates.length / 6));
    const list: { label: string; x: number; index: number }[] = [];
    for (let i = 0; i < dates.length; i += step) {
      list.push({ label: dates[i], x: getX(i), index: i });
    }
    // ensure last date is included
    if (list[list.length - 1]?.index !== dates.length - 1) {
      list.push({
        label: dates[dates.length - 1],
        x: getX(dates.length - 1),
        index: dates.length - 1,
      });
    }
    return list;
  }, [dates]);

  const activeHover = hoverIndex !== null && hoverIndex >= 0 && hoverIndex < dates.length;

  return (
    <div className="flex flex-col w-full">
      {/* Chart Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
          {filteredSeries.map((s) => (
            <div key={s.domain} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full ring-2 ring-slate-800"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-slate-200">{s.label}</span>
              <span className="text-slate-400 font-mono text-[11px]">({s.domain})</span>
            </div>
          ))}
        </div>

        {/* Time range buttons */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded-lg text-xs">
          {(
            [
              { id: '6m', labelFa: '۶ ماه', labelEn: '6M' },
              { id: '1y', labelFa: '۱ سال', labelEn: '1Y' },
              { id: '3y', labelFa: '۳ سال', labelEn: '3Y' },
              { id: 'all', labelFa: 'کامل (۲۰۱۹-۲۰۲۶)', labelEn: 'All' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setRange(item.id)}
              className={`px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap ${
                activeRange === item.id
                  ? 'bg-slate-800 text-cyan-400 font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isPersian ? item.labelFa : item.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Chart Canvas */}
      <div className="relative w-full overflow-hidden bg-slate-950/60 rounded-xl border border-slate-800/80 p-2">
        <svg
          viewBox={`0 0 ${svgWidth} ${height}`}
          className="w-full h-auto overflow-visible select-none"
          onMouseLeave={() => setHoverIndex(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clientX = e.clientX - rect.left;
            const normalizedX = (clientX / rect.width) * svgWidth;
            const relativeX = normalizedX - padding.left;
            const ratio = Math.max(0, Math.min(1, relativeX / plotWidth));
            const idx = Math.round(ratio * (dates.length - 1));
            setHoverIndex(idx);
          }}
        >
          <defs>
            {filteredSeries.map((s, idx) => (
              <linearGradient
                key={`grad-${s.domain}`}
                id={`grad-${idx}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={s.color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.0" />
              </linearGradient>
            ))}
          </defs>

          {/* Horizontal Grid lines */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={tick.y}
                x2={svgWidth - padding.right}
                y2={tick.y}
                stroke="#1e293b"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text
                x={padding.left - 10}
                y={tick.y + 4}
                textAnchor="end"
                className="text-[10px] fill-slate-500 font-mono tabular-nums"
              >
                #{tick.value.toLocaleString()}
              </text>
            </g>
          ))}

          {/* Vertical axis line */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + plotHeight}
            stroke="#334155"
            strokeWidth="1"
          />

          {/* Area under curve (if single series) */}
          {filteredSeries.length === 1 && paths[0]?.area && (
            <path d={paths[0].area} fill="url(#grad-0)" />
          )}

          {/* Series Curves */}
          {paths.map((p, idx) => (
            <path
              key={filteredSeries[idx].domain}
              d={p.path}
              fill="none"
              stroke={filteredSeries[idx].color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {/* X Axis ticks */}
          {xTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={tick.x}
                y1={padding.top + plotHeight}
                x2={tick.x}
                y2={padding.top + plotHeight + 5}
                stroke="#475569"
                strokeWidth="1"
              />
              <text
                x={tick.x}
                y={padding.top + plotHeight + 18}
                textAnchor="middle"
                className="text-[10px] fill-slate-500 font-mono"
              >
                {tick.label}
              </text>
            </g>
          ))}

          {/* Interactive Crosshair */}
          {activeHover && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1={padding.top}
                x2={getX(hoverIndex)}
                y2={padding.top + plotHeight}
                stroke="#06b6d4"
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.8"
              />

              {/* Data points markers */}
              {filteredSeries.map((s, idx) => {
                const pt = s.points[hoverIndex];
                if (!pt) return null;
                const cx = getX(hoverIndex);
                const cy = getY(pt.rank);
                return (
                  <circle
                    key={s.domain}
                    cx={cx}
                    cy={cy}
                    r="4.5"
                    fill={s.color}
                    stroke="#0f172a"
                    strokeWidth="2"
                  />
                );
              })}
            </g>
          )}
        </svg>

        {/* Floating Tooltip Box */}
        {activeHover && (
          <div
            className="absolute top-4 pointer-events-none z-20 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-lg p-2.5 shadow-xl text-xs"
            style={{
              left: `${Math.min(75, Math.max(10, (getX(hoverIndex) / svgWidth) * 100))}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="text-slate-400 font-mono text-[11px] mb-1.5 border-b border-slate-800 pb-1 flex items-center justify-between gap-4">
              <span>{isPersian ? 'تاریخ گزارش ترنکو:' : 'Tranco Snapshot:'}</span>
              <span className="text-cyan-400 font-bold">{dates[hoverIndex]}</span>
            </div>
            <div className="space-y-1">
              {filteredSeries.map((s) => {
                const pt = s.points[hoverIndex];
                if (!pt) return null;
                return (
                  <div key={s.domain} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="text-slate-200">{s.label}</span>
                    </div>
                    <span className="font-mono text-cyan-300 font-semibold tabular-nums">
                      #{pt.rank.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Helper Legend / Subtitle */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
        <span>
          {isPersian
            ? '↑ محور عمودی معکوس: رتبه‌های برتر (عدد کوچکتر) در بالای نمودار قرار دارند'
            : '↑ Inverted Y-axis: Top ranks (lower number) are plotted higher'}
        </span>
        <span className="font-mono text-slate-500">
          {isPersian ? 'داده‌های پژوهشی Tranco List' : 'Tranco Research Dataset'}
        </span>
      </div>
    </div>
  );
};

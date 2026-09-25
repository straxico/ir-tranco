import React from 'react';
import { ExternalLink, TrendingUp, TrendingDown, Check, Plus, ShieldCheck } from 'lucide-react';
import { DomainItem } from '../types/domain';

interface DomainCardProps {
  domain: DomainItem;
  onSelect: (domain: DomainItem) => void;
  isCompared: boolean;
  onToggleCompare: (domain: DomainItem) => void;
  isPersian: boolean;
}

export const DomainCard: React.FC<DomainCardProps> = ({
  domain,
  onSelect,
  isCompared,
  onToggleCompare,
  isPersian,
}) => {
  // Generate mini sparkline points from history (last 18 points)
  const sparklinePts = domain.history.slice(-18);
  const minRank = Math.min(...sparklinePts.map((p) => p.rank));
  const maxRank = Math.max(...sparklinePts.map((p) => p.rank));
  const width = 110;
  const height = 32;

  // Inverted Y: lower rank number = higher on chart
  const pointsString = sparklinePts
    .map((p, i) => {
      const x = (i / (sparklinePts.length - 1)) * width;
      const y =
        maxRank === minRank
          ? height / 2
          : ((p.rank - minRank) / (maxRank - minRank)) * (height - 6) + 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const isGrowth1Y = domain.rank1yChange > 0;
  const isGrowth30d = domain.rank30dChange > 0;

  return (
    <div className="group relative flex flex-col justify-between p-5 bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 rounded-xl transition-all">
      {/* Top Row: Title & Domain Link */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <h3
              onClick={() => onSelect(domain)}
              className="text-base font-bold text-white hover:text-cyan-400 transition-colors cursor-pointer"
            >
              {isPersian ? domain.titleFa : domain.titleEn}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
              <span className="font-mono text-cyan-400/90">{domain.domain}</span>
              <a
                href={`https://${domain.domain}`}
                target="_blank"
                rel="noreferrer noopener"
                className="text-slate-500 hover:text-slate-300 transition-colors"
                title="Open website"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Compare Toggle Button */}
          <button
            onClick={() => onToggleCompare(domain)}
            title={isCompared ? 'حذف از لیست مقایسه' : 'افزودن به لیست مقایسه'}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors cursor-pointer whitespace-nowrap ${
              isCompared
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
            }`}
          >
            {isCompared ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
            <span className="text-[11px] font-medium">
              {isCompared ? (isPersian ? 'در مقایسه' : 'Comparing') : isPersian ? 'مقایسه' : 'Compare'}
            </span>
          </button>
        </div>

        {/* Quiet, unboxed metadata (anti-slop rule: NO pill boxes) */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-4">
          <span className="text-slate-300">{domain.categoryFa}</span>
          <span aria-hidden="true">·</span>
          <span>{domain.hosting.provider}</span>
          <span aria-hidden="true">·</span>
          {domain.trancoLive ? (
            <span className="flex items-center gap-1 text-cyan-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>{isPersian ? 'استعلام مستقیم ترنکو' : 'Live Tranco API'}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-400/90">
              <ShieldCheck className="w-3 h-3" />
              <span>{isPersian ? 'bootmortis تایید' : 'bootmortis verified'}</span>
            </span>
          )}
        </div>

        {/* Short description */}
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
          {isPersian ? domain.descriptionFa : domain.descriptionEn}
        </p>
      </div>

      {/* Bottom Metrics Bar */}
      <div className="pt-3 border-t border-slate-800/80 flex items-end justify-between gap-3">
        {/* Tranco Current Rank */}
        <div>
          <div className="text-[11px] text-slate-500 mb-0.5 font-medium">
            {isPersian ? 'رتبه جهانی ترنکو' : 'Global Tranco Rank'}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-white tabular-nums tracking-tight">
              #{domain.currentRank.toLocaleString()}
            </span>
            <div
              className={`flex items-center gap-0.5 text-xs font-mono font-medium tabular-nums ${
                isGrowth1Y ? 'text-emerald-400' : 'text-rose-400'
              }`}
              title={isPersian ? 'تغییر رتبه نسبت به یک سال قبل' : '1-Year Rank Change'}
            >
              {isGrowth1Y ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{Math.abs(domain.rank1yChange).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Sparkline & Detail Click */}
        <div className="flex flex-col items-end gap-1.5">
          <svg width={width} height={height} className="overflow-visible opacity-80 group-hover:opacity-100 transition-opacity">
            <polyline
              fill="none"
              stroke={isGrowth1Y ? '#10b981' : '#f43f5e'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={pointsString}
            />
          </svg>
          <button
            onClick={() => onSelect(domain)}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium transition-colors cursor-pointer"
          >
            {isPersian ? 'تاریخچه ماهانه و جزئیات ←' : 'Monthly History →'}
          </button>
        </div>
      </div>
    </div>
  );
};

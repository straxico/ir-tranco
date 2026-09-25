import React from 'react';
import { ExternalLink, TrendingUp, TrendingDown, Check, Plus, ArrowUpDown } from 'lucide-react';
import { DomainItem, SortOption } from '../types/domain';

interface DomainTableProps {
  domains: DomainItem[];
  onSelect: (domain: DomainItem) => void;
  comparedDomains: DomainItem[];
  onToggleCompare: (domain: DomainItem) => void;
  isPersian: boolean;
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export const DomainTable: React.FC<DomainTableProps> = ({
  domains,
  onSelect,
  comparedDomains,
  onToggleCompare,
  isPersian,
  currentSort,
  onSortChange,
}) => {
  const isCompared = (domain: string) =>
    comparedDomains.some((d) => d.domain.toLowerCase() === domain.toLowerCase());

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/30">
      <table className="w-full text-right text-xs border-collapse">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-medium">
            <th className="py-3 px-4 w-12 text-center">#</th>
            <th className="py-3 px-4">
              <button
                onClick={() => onSortChange(currentSort === 'name_fa' ? 'rank_asc' : 'name_fa')}
                className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
              >
                <span>{isPersian ? 'نام و وبسایت' : 'Domain & Name'}</span>
                <ArrowUpDown className="w-3 h-3" />
              </button>
            </th>
            <th className="py-3 px-4">{isPersian ? 'دسته‌بندی' : 'Category'}</th>
            <th className="py-3 px-4">
              <button
                onClick={() => onSortChange(currentSort === 'rank_asc' ? 'rank_desc' : 'rank_asc')}
                className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
              >
                <span>{isPersian ? 'رتبه کنونی ترنکو' : 'Tranco Rank'}</span>
                <ArrowUpDown className="w-3 h-3" />
              </button>
            </th>
            <th className="py-3 px-4">
              <button
                onClick={() => onSortChange(currentSort === 'growth_1y' ? 'drop_1y' : 'growth_1y')}
                className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
              >
                <span>{isPersian ? 'روند سالانه (1Y)' : '1-Year Trend'}</span>
                <ArrowUpDown className="w-3 h-3" />
              </button>
            </th>
            <th className="py-3 px-4">{isPersian ? 'بهترین رتبه تاریخ' : 'Peak Rank'}</th>
            <th className="py-3 px-4">{isPersian ? 'میزبانی و CDN' : 'Hosting / CDN'}</th>
            <th className="py-3 px-4 text-center">{isPersian ? 'اقدام' : 'Action'}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {domains.map((d, index) => {
            const compared = isCompared(d.domain);
            const isGrowth1Y = d.rank1yChange > 0;

            return (
              <tr
                key={d.domain}
                className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                onClick={() => onSelect(d)}
              >
                {/* Index */}
                <td className="py-3 px-4 text-center font-mono text-slate-500 tabular-nums">
                  {index + 1}
                </td>

                {/* Name & Domain */}
                <td className="py-3 px-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors">
                      {isPersian ? d.titleFa : d.titleEn}
                    </span>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono mt-0.5">
                      <span>{d.domain}</span>
                      <a
                        href={`https://${d.domain}`}
                        target="_blank"
                        rel="noreferrer noopener"
                        onClick={(e) => e.stopPropagation()}
                        className="text-slate-500 hover:text-slate-300"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                </td>

                {/* Category */}
                <td className="py-3 px-4 text-slate-300">
                  <span>{d.categoryFa}</span>
                </td>

                {/* Current Tranco Rank */}
                <td className="py-3 px-4">
                  <span className="font-mono font-bold text-white tabular-nums text-sm">
                    #{d.currentRank.toLocaleString()}
                  </span>
                </td>

                {/* 1Y Trend */}
                <td className="py-3 px-4">
                  <div
                    className={`flex items-center gap-1 font-mono font-medium tabular-nums ${
                      isGrowth1Y ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isGrowth1Y ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    <span>{Math.abs(d.rank1yChange).toLocaleString()}</span>
                  </div>
                </td>

                {/* Peak Rank */}
                <td className="py-3 px-4">
                  <div className="flex flex-col">
                    <span className="font-mono text-cyan-300 font-semibold tabular-nums">
                      #{d.peakRank.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {d.peakDate}
                    </span>
                  </div>
                </td>

                {/* Hosting & CDN */}
                <td className="py-3 px-4 text-slate-400">
                  <div className="flex flex-col">
                    <span className="text-slate-300">{d.hosting.provider}</span>
                    <span className="text-[10px] font-mono text-slate-500">{d.hosting.asn}</span>
                  </div>
                </td>

                {/* Actions: Compare */}
                <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onToggleCompare(d)}
                    className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      compared
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                    title={compared ? 'حذف از مقایسه' : 'افزودن به مقایسه'}
                  >
                    {compared ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

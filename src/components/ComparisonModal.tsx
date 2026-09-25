import React, { useState } from 'react';
import { X, Plus, Trash2, ArrowRightLeft, Sparkles, ExternalLink } from 'lucide-react';
import { DomainItem, TimeRange } from '../types/domain';
import { RankChart } from './RankChart';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  comparedDomains: DomainItem[];
  allDomains: DomainItem[];
  onRemoveDomain: (domain: DomainItem) => void;
  onAddDomain: (domain: DomainItem) => void;
  onSelectDomain: (domain: DomainItem) => void;
  isPersian: boolean;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
  isOpen,
  onClose,
  comparedDomains,
  allDomains,
  onRemoveDomain,
  onAddDomain,
  onSelectDomain,
  isPersian,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // Preset bundles for 1-click comparison
  const presets = [
    {
      nameFa: 'اجاره ویلا و اقامتگاه',
      nameEn: 'Villa Rentals',
      domains: ['jabama.com', 'jajiga.com', 'shab.ir', 'otaghak.com'],
    },
    {
      nameFa: 'رزرو پرواز و هتل',
      nameEn: 'Flight & Hotel',
      domains: ['alibaba.ir', 'flytoday.ir', 'snapptrip.com', 'safarmarket.com'],
    },
    {
      nameFa: 'طلا، سکه و فلزات',
      nameEn: 'Gold & Bullion',
      domains: ['tgju.org', 'tala.ir', 'melligold.com', 'goldika.ir'],
    },
    {
      nameFa: 'صرافی‌های ارز دیجیتال',
      nameEn: 'Crypto Exchanges',
      domains: ['nobitex.ir', 'wallex.ir', 'bitpin.ir', 'abantether.com'],
    },
    {
      nameFa: 'ایکامرس و مقایسه قیمت',
      nameEn: 'E-Commerce Retail',
      domains: ['digikala.com', 'torob.com', 'basalam.com', 'technolife.ir'],
    },
    {
      nameFa: 'سوپراپ و تاکسی آنلاین',
      nameEn: 'Mobility & Taxi',
      domains: ['snapp.ir', 'tapsi.ir'],
    },
  ];

  const handleApplyPreset = (domainNames: string[]) => {
    // Clear existing and add preset domains
    const toAdd = allDomains.filter((d) => domainNames.includes(d.domain));
    toAdd.forEach((d) => onAddDomain(d));
  };

  // Search filtered domains to add
  const availableToAdd = allDomains.filter(
    (d) =>
      !comparedDomains.some((c) => c.domain === d.domain) &&
      (d.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.titleFa.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.titleEn.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isPersian ? 'میز مقایسه هوشمند وبسایت‌ها' : 'Domain Comparison Engine'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isPersian
                  ? 'مقایسه همپوشانی رتبه‌بندی ترنکو، تاریخچه ماهانه از ۲۰۱۹ و عملکرد ترافیکی'
                  : 'Side-by-side Tranco trajectory comparison and metric matrix'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick Preset Buttons */}
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isPersian ? 'دسته‌های مقایسه سریع (آماده):' : 'Instant Benchmark Bundles:'}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <button
                  key={p.nameEn}
                  onClick={() => handleApplyPreset(p.domains)}
                  className="px-3 py-1.5 rounded-lg text-xs bg-slate-950 border border-slate-800 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  {isPersian ? p.nameFa : p.nameEn}
                </button>
              ))}
            </div>
          </div>

          {/* Currently Selected Domains Bar */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">
                {isPersian
                  ? `دامنه‌های در حال مقایسه (${comparedDomains.length} از ۵):`
                  : `Active Comparison List (${comparedDomains.length}/5):`}
              </span>
              {comparedDomains.length > 0 && (
                <button
                  onClick={() => comparedDomains.forEach((d) => onRemoveDomain(d))}
                  className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{isPersian ? 'پاک‌سازی همه' : 'Clear All'}</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {comparedDomains.map((d) => (
                <div
                  key={d.domain}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-slate-900 border border-cyan-500/30 text-white shadow-sm"
                >
                  <span className="font-semibold">{isPersian ? d.titleFa : d.titleEn}</span>
                  <span className="text-slate-400 font-mono text-[11px]">({d.domain})</span>
                  <button
                    onClick={() => onRemoveDomain(d)}
                    className="text-slate-500 hover:text-rose-400 p-0.5 transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {comparedDomains.length === 0 && (
                <span className="text-xs text-slate-500 italic">
                  {isPersian
                    ? 'هیچ وبسایتی انتخاب نشده است. از دسته‌های بالا انتخاب کنید یا دامنه دلخواه را اضافه نمایید.'
                    : 'No domains selected. Pick a benchmark bundle above or add a domain below.'}
                </span>
              )}
            </div>

            {/* Add More Search Input */}
            {comparedDomains.length < 5 && (
              <div className="pt-2 border-t border-slate-800/80">
                <input
                  type="text"
                  placeholder={
                    isPersian
                      ? 'جستجوی نام شرکت یا دامنه برای افزودن به مقایسه...'
                      : 'Search company or domain to add...'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                {searchQuery && (
                  <div className="max-h-36 overflow-y-auto mt-2 space-y-1">
                    {availableToAdd.slice(0, 6).map((item) => (
                      <button
                        key={item.domain}
                        onClick={() => {
                          onAddDomain(item);
                          setSearchQuery('');
                        }}
                        className="w-full flex items-center justify-between px-3 py-1.5 rounded text-xs bg-slate-900 hover:bg-slate-800 text-slate-200 transition-colors text-right"
                      >
                        <div className="flex items-center gap-2">
                          <Plus className="w-3 h-3 text-cyan-400" />
                          <span className="font-medium">{isPersian ? item.titleFa : item.titleEn}</span>
                          <span className="font-mono text-slate-400 text-[11px]">({item.domain})</span>
                        </div>
                        <span className="font-mono text-cyan-400 text-xs">
                          #{item.currentRank.toLocaleString()}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Overlaid Historical Ranking Chart */}
          {comparedDomains.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white">
                {isPersian
                  ? 'نمودار مقایسه روند رتبه ترنکو در طول زمان'
                  : 'Tranco Trajectory Comparison Chart'}
              </h3>
              <RankChart
                domains={comparedDomains}
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
                height={320}
                isPersian={isPersian}
              />
            </div>
          )}

          {/* Side-by-Side Metric Matrix */}
          {comparedDomains.length > 0 && (
            <div className="w-full overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
              <table className="w-full text-right text-xs border-collapse">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="py-2.5 px-4">{isPersian ? 'شاخص مقایسه' : 'Metric'}</th>
                    {comparedDomains.map((d) => (
                      <th key={d.domain} className="py-2.5 px-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-white">{isPersian ? d.titleFa : d.titleEn}</span>
                          <button
                            onClick={() => onSelectDomain(d)}
                            className="text-cyan-400 hover:text-cyan-300 text-[11px]"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-slate-400">{isPersian ? 'دامنه وبسایت' : 'Domain'}</td>
                    {comparedDomains.map((d) => (
                      <td key={d.domain} className="py-2.5 px-4 font-mono text-cyan-400 font-medium">
                        {d.domain}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-slate-400">{isPersian ? 'رتبه جهانی کنونی' : 'Current Rank'}</td>
                    {comparedDomains.map((d) => (
                      <td key={d.domain} className="py-2.5 px-4 font-mono font-bold text-white tabular-nums">
                        #{d.currentRank.toLocaleString()}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-slate-400">{isPersian ? 'تغییر سالانه (1Y)' : '1Y Change'}</td>
                    {comparedDomains.map((d) => {
                      const isUp = d.rank1yChange > 0;
                      return (
                        <td
                          key={d.domain}
                          className={`py-2.5 px-4 font-mono font-medium tabular-nums ${
                            isUp ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isUp ? '▲ +' : '▼ '}
                          {Math.abs(d.rank1yChange).toLocaleString()}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-slate-400">{isPersian ? 'بهترین رتبه تاریخی' : 'Peak Rank'}</td>
                    {comparedDomains.map((d) => (
                      <td key={d.domain} className="py-2.5 px-4 font-mono text-cyan-300 tabular-nums">
                        #{d.peakRank.toLocaleString()}{' '}
                        <span className="text-[10px] text-slate-500">({d.peakDate})</span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-slate-400">{isPersian ? 'میزبان و CDN' : 'Hosting / CDN'}</td>
                    {comparedDomains.map((d) => (
                      <td key={d.domain} className="py-2.5 px-4 text-slate-300">
                        {d.hosting.provider}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

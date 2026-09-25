import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ShieldCheck,
  Server,
  Layers,
  Award,
  Check,
  Plus,
  Calendar,
} from 'lucide-react';
import { DomainItem, TimeRange } from '../types/domain';
import { RankChart } from './RankChart';
import { refreshDomainCache } from '../services/api';

interface DomainDetailModalProps {
  domain: DomainItem | null;
  onClose: () => void;
  onToggleCompare: (domain: DomainItem) => void;
  isCompared: boolean;
  isPersian: boolean;
  allDomains: DomainItem[];
  onSelectDomain: (domain: DomainItem) => void;
  onDomainUpdated: (updated: DomainItem) => void;
}

export const DomainDetailModal: React.FC<DomainDetailModalProps> = ({
  domain,
  onClose,
  onToggleCompare,
  isCompared,
  isPersian,
  allDomains,
  onSelectDomain,
  onDomainUpdated,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'chart' | 'table'>('chart');

  if (!domain) return null;

  // Rank position in category
  const categoryPeers = allDomains
    .filter((d) => d.category === domain.category)
    .sort((a, b) => a.currentRank - b.currentRank);
  const rankInCategory = categoryPeers.findIndex((d) => d.domain === domain.domain) + 1;

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      const updated = await refreshDomainCache(domain.domain);
      onDomainUpdated(updated);
    } catch {
      // ignore
    } finally {
      setIsRefreshing(false);
    }
  };

  const isGrowth1Y = domain.rank1yChange > 0;
  const isGrowth5Y = domain.rank5yChange > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-lg font-mono shrink-0">
              {domain.domain.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">
                  {isPersian ? domain.titleFa : domain.titleEn}
                </h2>
                <span className="text-sm text-slate-400">({domain.titleEn})</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                <span className="font-mono text-cyan-400 font-medium">{domain.domain}</span>
                <span aria-hidden="true">·</span>
                <a
                  href={`https://${domain.domain}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                >
                  <span>{isPersian ? 'بازدید از وبسایت' : 'Visit Website'}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span aria-hidden="true">·</span>
                <span className="text-slate-300">{domain.categoryFa}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Compare Toggle */}
            <button
              onClick={() => onToggleCompare(domain)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                isCompared
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                  : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              {isCompared ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{isCompared ? (isPersian ? 'در لیست مقایسه' : 'Comparing') : isPersian ? 'افزودن به مقایسه' : 'Compare'}</span>
            </button>

            {/* Live Refresh Tranco */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              title={isPersian ? 'تازه‌سازی استعلام از ترنکو' : 'Refresh Tranco Ranks'}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-cyan-400 hover:bg-slate-700/60 border border-slate-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Key Stat Cards (Single-Elevation, clean border, no pill slop) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* 1. Current Rank */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>{isPersian ? 'رتبه کنونی جهانی' : 'Current Global Rank'}</span>
                {domain.trancoLive && (
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" title="Direct Tranco Data" />
                )}
              </div>
              <div className="text-xl font-bold font-mono text-white tabular-nums">
                #{domain.currentRank.toLocaleString()}
              </div>
              <div className="text-[10px] text-cyan-400 mt-1 font-mono flex items-center justify-between">
                <span>{domain.trancoLive ? (isPersian ? 'داده زنده Tranco' : 'Live Tranco API') : (isPersian ? 'فهرست ترنکو' : 'Tranco List')}</span>
                <span className="text-slate-500 font-sans">{domain.cachedAt ? new Date(domain.cachedAt).toLocaleDateString('fa-IR') : ''}</span>
              </div>
            </div>

            {/* 2. Peak Rank */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-[11px] text-slate-400 mb-1">
                {isPersian ? 'بهترین رتبه تاریخی' : 'All-Time Peak Rank'}
              </div>
              <div className="text-xl font-bold font-mono text-cyan-300 tabular-nums">
                #{domain.peakRank.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono flex items-center gap-1">
                <Calendar className="w-3 h-3 text-cyan-500" />
                <span>{domain.peakDate}</span>
              </div>
            </div>

            {/* 3. Category Position */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-[11px] text-slate-400 mb-1">
                {isPersian ? 'جایگاه در دسته‌بندی' : 'Category Standing'}
              </div>
              <div className="text-xl font-bold text-amber-300 flex items-center gap-1.5">
                <Award className="w-5 h-5 text-amber-400" />
                <span>
                  {isPersian ? `رتبه ${rankInCategory} از ${categoryPeers.length}` : `#${rankInCategory} of ${categoryPeers.length}`}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1 truncate">
                {domain.categoryFa}
              </div>
            </div>

            {/* 4. 1-Year Movement */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-[11px] text-slate-400 mb-1">
                {isPersian ? 'تغییر رتبه ۱ ساله' : '1-Year Rank Change'}
              </div>
              <div
                className={`text-xl font-bold font-mono tabular-nums flex items-center gap-1 ${
                  isGrowth1Y ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isGrowth1Y ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                <span>{Math.abs(domain.rank1yChange).toLocaleString()}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {isGrowth1Y
                  ? isPersian ? 'ارتقای محبوبیت ترافیک' : 'Traffic rank climbed'
                  : isPersian ? 'کاهش نسبی رتبه' : 'Rank dropped'}
              </div>
            </div>
          </div>

          {/* Chart & History View Switcher */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">
                  {isPersian ? 'روند تغییرات رتبه ماهانه (۲۰۱۹ تا ۲۰۲۶)' : 'Monthly Rank Trajectory (2019-2026)'}
                </h3>
              </div>

              <div className="flex items-center gap-1 p-0.5 bg-slate-950 border border-slate-800 rounded-lg text-xs">
                <button
                  onClick={() => setActiveTab('chart')}
                  className={`px-3 py-1 rounded transition-colors ${
                    activeTab === 'chart'
                      ? 'bg-slate-800 text-cyan-400 font-medium'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isPersian ? 'نمودار ترنکو' : 'Visual Chart'}
                </button>
                <button
                  onClick={() => setActiveTab('table')}
                  className={`px-3 py-1 rounded transition-colors ${
                    activeTab === 'table'
                      ? 'bg-slate-800 text-cyan-400 font-medium'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isPersian ? 'جدول ماه به ماه' : 'Monthly Table'}
                </button>
              </div>
            </div>

            {activeTab === 'chart' ? (
              <RankChart
                domains={[domain]}
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
                height={290}
                isPersian={isPersian}
              />
            ) : (
              <div className="max-h-64 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950/60">
                <table className="w-full text-right text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-400 font-medium">
                    <tr>
                      <th className="py-2.5 px-4">{isPersian ? 'ماه و سال' : 'Date'}</th>
                      <th className="py-2.5 px-4">{isPersian ? 'شناسه لیست ترنکو' : 'List ID'}</th>
                      <th className="py-2.5 px-4">{isPersian ? 'رتبه جهانی ترنکو' : 'Rank'}</th>
                      <th className="py-2.5 px-4">{isPersian ? 'تغییر ماهانه' : 'MoM Change'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {[...domain.history].reverse().map((pt, idx, arr) => {
                      const nextPt = arr[idx + 1];
                      const change = nextPt ? nextPt.rank - pt.rank : 0;
                      const isUp = change > 0;

                      return (
                        <tr key={pt.date} className="hover:bg-slate-800/30">
                          <td className="py-2 px-4 text-slate-300 font-bold">{pt.date}</td>
                          <td className="py-2 px-4 text-slate-500 text-[11px]">{pt.listId || '-'}</td>
                          <td className="py-2 px-4 text-cyan-300 font-bold tabular-nums">
                            #{pt.rank.toLocaleString()}
                          </td>
                          <td className="py-2 px-4 tabular-nums">
                            {nextPt ? (
                              <span className={isUp ? 'text-emerald-400' : 'text-rose-400'}>
                                {isUp ? '▲ +' : '▼ '}
                                {Math.abs(change).toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Hosting & Infrastructure (iran-hosted-domains verification) */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white">
                  {isPersian ? 'مشخصات زیرساخت، سرور و میزبانی ایران' : 'Infrastructure & Network Specs'}
                </h4>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isPersian ? 'تایید شده در bootmortis/iran-hosted-domains' : 'Verified Iranian Host'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px] mb-0.5">{isPersian ? 'سرویس‌دهنده و مرکز داده:' : 'Datacenter / ISP:'}</span>
                <span className="text-slate-200 font-medium">{domain.hosting.provider}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] mb-0.5">{isPersian ? 'شماره سیستم خودمختار (ASN):' : 'Autonomous System (ASN):'}</span>
                <span className="text-slate-200 font-mono text-[11px]">{domain.hosting.asn}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] mb-0.5">{isPersian ? 'آدرس آی‌پی (IP Address):' : 'IP Address:'}</span>
                <span className="text-cyan-400 font-mono">{domain.hosting.ip}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] mb-0.5">{isPersian ? 'شبکه توزیع محتوا (CDN):' : 'CDN Network:'}</span>
                <span className="text-slate-200">{domain.hosting.cdn}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] mb-0.5">{isPersian ? 'صادرکننده گواهی SSL:' : 'SSL Authority:'}</span>
                <span className="text-slate-200">{domain.hosting.sslIssuer}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] mb-0.5">{isPersian ? 'موقعیت جغرافیایی سرور:' : 'Server Location:'}</span>
                <span className="text-slate-200">{domain.hosting.location}</span>
              </div>
            </div>
          </div>

          {/* Category Competitors / Peers */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>{isPersian ? 'سایر وبسایت‌های فعال در همین دسته:' : 'Other Sites in this Category:'}</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {categoryPeers
                .filter((p) => p.domain !== domain.domain)
                .map((peer) => (
                  <button
                    key={peer.domain}
                    onClick={() => onSelectDomain(peer)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-slate-700 transition-colors cursor-pointer"
                  >
                    <span>{isPersian ? peer.titleFa : peer.titleEn}</span>
                    <span className="font-mono text-cyan-400 text-[11px] tabular-nums">
                      #{peer.currentRank.toLocaleString()}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

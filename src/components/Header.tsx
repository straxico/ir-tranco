import React from 'react';
import { Database, Plus, RefreshCw, BarChart2, Globe } from 'lucide-react';
import { CacheStats } from '../types/domain';

interface HeaderProps {
  currentTab: 'all' | 'categories' | 'compare' | 'methodology';
  onSelectTab: (tab: 'all' | 'categories' | 'compare' | 'methodology') => void;
  compareCount: number;
  onOpenCompare: () => void;
  onOpenLookup: () => void;
  onOpenCache: () => void;
  cacheStats: CacheStats | null;
  isPersian: boolean;
  onToggleLanguage: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  compareCount,
  onOpenCompare,
  onOpenLookup,
  onOpenCache,
  cacheStats,
  isPersian,
  onToggleLanguage,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/85 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Single Text Element Brand Wordmark */}
        <button
          onClick={() => onSelectTab('all')}
          className="text-lg font-bold tracking-tight text-white hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>{isPersian ? 'ترنکو ایران' : 'IranDomain Intelligence'}</span>
        </button>

        {/* Zone 2: 4 Clean Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            onClick={() => onSelectTab('all')}
            className={`transition-colors whitespace-nowrap pb-1 ${
              currentTab === 'all'
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
                : 'hover:text-slate-200'
            }`}
          >
            {isPersian ? 'پیشخوان دامنه‌ها' : 'Domain Directory'}
          </button>

          <button
            onClick={() => onSelectTab('categories')}
            className={`transition-colors whitespace-nowrap pb-1 ${
              currentTab === 'categories'
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
                : 'hover:text-slate-200'
            }`}
          >
            {isPersian ? 'دسته‌بندی‌های تخصصی' : 'Market Sectors'}
          </button>

          <button
            onClick={() => {
              onSelectTab('compare');
              onOpenCompare();
            }}
            className={`relative transition-colors whitespace-nowrap pb-1 flex items-center gap-1.5 ${
              currentTab === 'compare'
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
                : 'hover:text-slate-200'
            }`}
          >
            <span>{isPersian ? 'مقایسه وبسایت‌ها' : 'Compare'}</span>
            {compareCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 font-mono text-xs font-bold flex items-center justify-center">
                {compareCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('methodology')}
            className={`transition-colors whitespace-nowrap pb-1 ${
              currentTab === 'methodology'
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
                : 'hover:text-slate-200'
            }`}
          >
            {isPersian ? 'روش‌شناسی و دیتا' : 'Methodology & Sources'}
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2.5">
          {/* Cache Status Inspector Button */}
          <button
            onClick={onOpenCache}
            title={isPersian ? 'مدیریت و آمار حافظه کش ترنکو' : 'Tranco Cache Status'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white transition-colors whitespace-nowrap"
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline font-mono">
              {cacheStats ? `${cacheStats.cachedEntries} ${isPersian ? 'کش' : 'cached'}` : 'Cache'}
            </span>
          </button>

          {/* Add / Lookup Domain Button */}
          <button
            onClick={onOpenLookup}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors shadow-sm shadow-cyan-500/10 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isPersian ? 'افزودن یا استعلام دامنه' : 'Lookup Domain'}</span>
          </button>

          {/* Language Toggle */}
          <button
            onClick={onToggleLanguage}
            title={isPersian ? 'تغییر به زبان انگلیسی' : 'Switch to Persian'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
          >
            <Globe className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

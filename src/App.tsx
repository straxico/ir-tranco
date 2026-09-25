import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  LayoutGrid,
  List,
  ArrowUpDown,
  ArrowRightLeft,
  ShieldCheck,
  TrendingUp,
  Database,
  ExternalLink,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { DomainItem, CategoryItem, CacheStats, SortOption } from './types/domain';
import { fetchCategories, fetchDomains, fetchCacheStats } from './services/api';
import { Header } from './components/Header';
import { CategoryNav } from './components/CategoryNav';
import { DomainCard } from './components/DomainCard';
import { DomainTable } from './components/DomainTable';
import { DomainDetailModal } from './components/DomainDetailModal';
import { ComparisonModal } from './components/ComparisonModal';
import { AddDomainModal } from './components/AddDomainModal';
import { CacheManagerModal } from './components/CacheManagerModal';
import { MethodologyModal } from './components/MethodologyModal';

export default function App() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [domains, setDomains] = useState<DomainItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);

  // User state
  const [currentTab, setCurrentTab] = useState<'all' | 'categories' | 'compare' | 'methodology'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('rank_asc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isPersian, setIsPersian] = useState(true);

  // Modals & Panels
  const [inspectingDomain, setInspectingDomain] = useState<DomainItem | null>(null);
  const [comparedDomains, setComparedDomains] = useState<DomainItem[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [isCacheOpen, setIsCacheOpen] = useState(false);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  // Sync HTML dir and lang
  useEffect(() => {
    document.documentElement.dir = isPersian ? 'rtl' : 'ltr';
    document.documentElement.lang = isPersian ? 'fa' : 'en';
  }, [isPersian]);

  // Initial Load
  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        const [cats, doms, stats] = await Promise.all([
          fetchCategories(),
          fetchDomains(),
          fetchCacheStats(),
        ]);
        setCategories(cats);
        setDomains(doms);
        setCacheStats(stats);
      } catch (err) {
        console.error('Initial data loading failed:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // Filtered and Sorted Domains
  const filteredDomains = useMemo(() => {
    let result = [...domains];

    // Filter by Category
    if (selectedCategory !== 'all') {
      result = result.filter((d) => d.category === selectedCategory);
    }

    // Filter by Search
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (d) =>
          d.domain.toLowerCase().includes(q) ||
          d.titleFa.toLowerCase().includes(q) ||
          d.titleEn.toLowerCase().includes(q) ||
          d.categoryFa.toLowerCase().includes(q) ||
          d.hosting.provider.toLowerCase().includes(q)
      );
    }

    // Sorting
    switch (sortBy) {
      case 'rank_asc':
        result.sort((a, b) => a.currentRank - b.currentRank);
        break;
      case 'rank_desc':
        result.sort((a, b) => b.currentRank - a.currentRank);
        break;
      case 'growth_1y':
        result.sort((a, b) => b.rank1yChange - a.rank1yChange);
        break;
      case 'drop_1y':
        result.sort((a, b) => a.rank1yChange - b.rank1yChange);
        break;
      case 'name_fa':
        result.sort((a, b) => a.titleFa.localeCompare(b.titleFa, 'fa'));
        break;
      case 'name_en':
        result.sort((a, b) => a.titleEn.localeCompare(b.titleEn, 'en'));
        break;
      default:
        result.sort((a, b) => a.currentRank - b.currentRank);
        break;
    }

    return result;
  }, [domains, selectedCategory, searchQuery, sortBy]);

  // Comparison Handlers
  const handleToggleCompare = (domain: DomainItem) => {
    const exists = comparedDomains.some((d) => d.domain === domain.domain);
    if (exists) {
      setComparedDomains((prev) => prev.filter((d) => d.domain !== domain.domain));
    } else {
      if (comparedDomains.length >= 5) {
        alert(isPersian ? 'حداکثر می‌توانید ۵ دامنه را همزمان مقایسه کنید.' : 'Maximum 5 domains in comparison.');
        return;
      }
      setComparedDomains((prev) => [...prev, domain]);
    }
  };

  const handleAddDomainFromLookup = (newDomain: DomainItem) => {
    setDomains((prev) => {
      const exists = prev.some((d) => d.domain === newDomain.domain);
      if (exists) {
        return prev.map((d) => (d.domain === newDomain.domain ? newDomain : d));
      }
      return [newDomain, ...prev];
    });
    setInspectingDomain(newDomain);
  };

  const handleDomainUpdated = (updated: DomainItem) => {
    setDomains((prev) => prev.map((d) => (d.domain === updated.domain ? updated : d)));
    setInspectingDomain(updated);
  };

  const handleCacheReset = () => {
    fetchDomains().then(setDomains);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 1. Header (Adhering to Top Bar Contract) */}
      <Header
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 'methodology') setIsMethodologyOpen(true);
        }}
        compareCount={comparedDomains.length}
        onOpenCompare={() => setIsCompareOpen(true)}
        onOpenLookup={() => setIsLookupOpen(true)}
        onOpenCache={() => setIsCacheOpen(true)}
        cacheStats={cacheStats}
        isPersian={isPersian}
        onToggleLanguage={() => setIsPersian(!isPersian)}
      />

      {/* Main Workspace Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Executive Banner & Context Hero */}
        <div className="relative overflow-hidden p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>
                {isPersian
                  ? 'رصدخانه دامنه‌های ایران بر پایه Tranco List و iran-hosted-domains'
                  : 'Iranian Domain Observatory · Tranco Research Standard'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              {isPersian
                ? 'تحلیل رتبه، تاریخچه ماهانه از ۲۰۱۹ و مقایسه وبسایت‌های ایرانی'
                : 'Iran Domain Intelligence & Longitudinal Tranco Analytics'}
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl">
              {isPersian
                ? 'سامانه جامع رصد و تحلیل ترافیک دامنه‌های مستقر در دیتاسنترهای داخلی با تجمیع ماه به ماه از سال ۲۰۱۹، دسته‌بندی تخصصی (ویلا، پرواز، طلا، صرافی، ایکامرس و ...)، مقایسه همزمان و کشینگ آنی داده‌ها.'
                : 'High-fidelity ranking analytics for Iranian-hosted domains. Track longitudinal Tranco rankings from 2019 to 2026, benchmark competitors across 12 market sectors, and query live domains.'}
            </p>

            {/* Quick Metrics Bar (Natural typography, no pill badges) */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-3 text-xs text-slate-300 border-t border-slate-800/80">
              <div className="flex items-center gap-1.5 font-mono">
                <span className="font-bold text-white tabular-nums">
                  {cacheStats ? cacheStats.totalDomains.toLocaleString('fa-IR') : '۱۲۷,۰۶۴'}
                </span>
                <span className="text-slate-400">{isPersian ? 'دامنه میزبانی ایران (bootmortis)' : 'bootmortis domains'}</span>
              </div>
              <span className="text-slate-700" aria-hidden="true">·</span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="font-bold text-white tabular-nums">{categories.length}</span>
                <span className="text-slate-400">{isPersian ? 'دسته تخصصی بازار' : 'industry sectors'}</span>
              </div>
              <span className="text-slate-700" aria-hidden="true">·</span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="font-bold text-cyan-400 tabular-nums">
                  {cacheStats ? `${cacheStats.cachedEntries} دامنه` : 'API زنده'}
                </span>
                <span className="text-slate-400">{isPersian ? 'استعلام‌شده در کش Tranco' : 'in Tranco cache'}</span>
              </div>
              <span className="text-slate-700" aria-hidden="true">·</span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="font-bold text-emerald-400 tabular-nums">{'< 5ms'}</span>
                <span className="text-slate-400">{isPersian ? 'تاخیر پاسخ کش' : 'cache latency'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Tab Mode View */}
        {currentTab === 'categories' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {isPersian ? 'دسته‌بندی‌های تخصصی بازار وب ایران' : 'Sector Intelligence'}
                </h2>
                <p className="text-xs text-slate-400">
                  {isPersian
                    ? 'انتخاب هر حوزه برای مشاهده و مقایسه بازیگران اصلی'
                    : 'Select a market category to inspect leading players'}
                </p>
              </div>
              <button
                onClick={() => setCurrentTab('all')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
              >
                {isPersian ? '← بازگشت به کل دامنه‌ها' : '← Back to All Domains'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => {
                const catDomains = domains.filter((d) => d.category === cat.id);
                const topD = catDomains.sort((a, b) => a.currentRank - b.currentRank)[0];

                return (
                  <div
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setCurrentTab('all');
                    }}
                    className="p-5 rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
                          {isPersian ? cat.nameFa : cat.nameEn}
                        </h3>
                        <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                          {cat.domainCount} {isPersian ? 'سایت' : 'sites'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed mb-4">
                        {isPersian ? cat.descriptionFa : cat.nameEn}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">{isPersian ? 'برترین سایت:' : 'Top site:'}</span>
                        <span className="font-mono text-slate-200 font-semibold">
                          {topD ? (isPersian ? topD.titleFa : topD.titleEn) : cat.topDomain}
                        </span>
                      </div>
                      <span className="text-cyan-400 font-medium group-hover:translate-x-1 transition-transform">
                        {isPersian ? 'مشاهده دسته ←' : 'Explore →'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Directory View (Visible on 'all' tab) */}
        {currentTab === 'all' && (
          <div className="space-y-4">
            {/* Category Segmented Controls */}
            <CategoryNav
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              isPersian={isPersian}
              totalDomainsCount={domains.length}
            />

            {/* Filter, Search & Controls Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder={
                    isPersian
                      ? 'جستجو بر اساس نام شرکت، آدرس دامنه (مثال: jabama یا alibaba.ir) یا دیتاسنتر...'
                      : 'Search by domain, company name or hosting provider...'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pr-9 pl-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Sorting & View Controls */}
              <div className="flex items-center gap-2">
                {/* Sort Selector */}
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="rank_asc">{isPersian ? 'رتبه ترنکو (بهترین‌ها)' : 'Tranco Rank (Best)'}</option>
                    <option value="growth_1y">{isPersian ? 'بیشترین رشد ۱ ساله' : 'Highest 1Y Growth'}</option>
                    <option value="drop_1y">{isPersian ? 'بیشترین افت ۱ ساله' : 'Highest 1Y Drop'}</option>
                    <option value="name_fa">{isPersian ? 'حروف الفبا (فارسی)' : 'Alphabetical (FA)'}</option>
                    <option value="name_en">{isPersian ? 'حروف الفبا (انگلیسی)' : 'Alphabetical (EN)'}</option>
                  </select>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center p-0.5 bg-slate-950 border border-slate-800 rounded-lg">
                  <button
                    onClick={() => setViewMode('grid')}
                    title={isPersian ? 'نمای کارت‌ها' : 'Grid View'}
                    className={`p-1.5 rounded transition-colors ${
                      viewMode === 'grid' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    title={isPersian ? 'نمای جدول فشرده' : 'Table View'}
                    className={`p-1.5 rounded transition-colors ${
                      viewMode === 'table' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Results Count & Quick Compare Info */}
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <div>
                <span>{isPersian ? 'نمایش' : 'Showing'} </span>
                <span className="font-mono text-cyan-400 font-semibold">{filteredDomains.length}</span>
                <span> {isPersian ? 'دامنه' : 'domains'}</span>
                {selectedCategory !== 'all' && (
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="mr-2 text-cyan-400 hover:underline cursor-pointer"
                  >
                    ({isPersian ? 'حذف فیلتر دسته' : 'clear filter'})
                  </button>
                )}
              </div>

              {comparedDomains.length > 0 && (
                <button
                  onClick={() => setIsCompareOpen(true)}
                  className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>
                    {isPersian
                      ? `مشاهده مقایسه (${comparedDomains.length} وبسایت انتخاب شده)`
                      : `View Comparison (${comparedDomains.length} selected)`}
                  </span>
                </button>
              )}
            </div>

            {/* Domain Items Rendering */}
            {filteredDomains.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 space-y-3">
                <Search className="w-8 h-8 text-slate-600 mx-auto" />
                <h3 className="text-sm font-semibold text-slate-300">
                  {isPersian ? 'هیچ دامنه‌ای با این مشخصات یافت نشد' : 'No domains match your criteria'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {isPersian
                    ? 'می‌توانید هر دامنه دلخواهی را از طریق دکمه «استعلام یا افزودن دامنه» به صورت لحظه‌ای از ترنکو دریافت و اضافه کنید.'
                    : 'You can query any custom domain directly from Tranco and add it to the platform.'}
                </p>
                <button
                  onClick={() => setIsLookupOpen(true)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors"
                >
                  {isPersian ? 'استعلام این دامنه در ترنکو' : 'Lookup this domain on Tranco'}
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDomains.map((domain) => (
                  <DomainCard
                    key={domain.domain}
                    domain={domain}
                    onSelect={setInspectingDomain}
                    isCompared={comparedDomains.some((d) => d.domain === domain.domain)}
                    onToggleCompare={handleToggleCompare}
                    isPersian={isPersian}
                  />
                ))}
              </div>
            ) : (
              <DomainTable
                domains={filteredDomains}
                onSelect={setInspectingDomain}
                comparedDomains={comparedDomains}
                onToggleCompare={handleToggleCompare}
                isPersian={isPersian}
                currentSort={sortBy}
                onSortChange={setSortBy}
              />
            )}
          </div>
        )}
      </main>

      {/* Floating Sticky Comparison Bar (if domains selected) */}
      {comparedDomains.length > 0 && !isCompareOpen && (
        <aside
          aria-label={isPersian ? 'نوار دسترسی سریع مقایسه دامنه‌ها' : 'Domain Comparison Quick Bar'}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 max-w-xl w-[90%] bg-slate-900/95 backdrop-blur-md border border-cyan-500/40 rounded-xl p-3 shadow-2xl flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-xs text-slate-300 font-medium whitespace-nowrap">
              {isPersian ? 'دامنه‌های انتخابی:' : 'Selected:'}
            </span>
            <div className="flex items-center gap-1.5">
              {comparedDomains.map((d) => (
                <span
                  key={d.domain}
                  className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 text-xs font-mono font-medium"
                >
                  {d.domain}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsCompareOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors whitespace-nowrap"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>{isPersian ? 'مشاهده مقایسه' : 'Compare'}</span>
            </button>
            <button
              onClick={() => setComparedDomains([])}
              className="text-xs text-slate-400 hover:text-white px-2 py-1"
            >
              {isPersian ? 'انصراف' : 'Dismiss'}
            </button>
          </div>
        </aside>
      )}

      {/* Modals & Drawers */}
      <DomainDetailModal
        domain={inspectingDomain}
        onClose={() => setInspectingDomain(null)}
        onToggleCompare={handleToggleCompare}
        isCompared={
          inspectingDomain
            ? comparedDomains.some((d) => d.domain === inspectingDomain.domain)
            : false
        }
        isPersian={isPersian}
        allDomains={domains}
        onSelectDomain={setInspectingDomain}
        onDomainUpdated={handleDomainUpdated}
      />

      <ComparisonModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        comparedDomains={comparedDomains}
        allDomains={domains}
        onRemoveDomain={handleToggleCompare}
        onAddDomain={handleToggleCompare}
        onSelectDomain={(d) => {
          setIsCompareOpen(false);
          setInspectingDomain(d);
        }}
        isPersian={isPersian}
      />

      <AddDomainModal
        isOpen={isLookupOpen}
        onClose={() => setIsLookupOpen(false)}
        onDomainAdded={handleAddDomainFromLookup}
        isPersian={isPersian}
      />

      <CacheManagerModal
        isOpen={isCacheOpen}
        onClose={() => setIsCacheOpen(false)}
        cacheStats={cacheStats}
        onStatsUpdated={setCacheStats}
        onCacheReset={handleCacheReset}
        isPersian={isPersian}
      />

      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
        isPersian={isPersian}
      />
    </div>
  );
}

import React, { useEffect, useRef, useState } from "react";
import { Search, LayoutGrid, List, RefreshCw } from "lucide-react";
import {
  CategoryItem,
  CacheStats,
  DataManifest,
  DomainItem,
  SortOption,
} from "./types/domain";
import {
  fetchCategories,
  fetchDomains,
  fetchCacheStats,
  fetchManifest,
  fetchDomainDetail,
} from "./services/api";
import { Header } from "./components/Header";
import { DomainCard } from "./components/DomainCard";
import { DomainTable } from "./components/DomainTable";
import { DomainDetailModal } from "./components/DomainDetailModal";
import { ComparisonModal } from "./components/ComparisonModal";
import { AddDomainModal } from "./components/AddDomainModal";
import { CacheManagerModal } from "./components/CacheManagerModal";
import { MethodologyModal } from "./components/MethodologyModal";

const PAGE_SIZE = 60;
export default function App() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [domains, setDomains] = useState<DomainItem[]>([]);
  const [total, setTotal] = useState(0);
  const [manifest, setManifest] = useState<DataManifest | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [detailError, setDetailError] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [retry, setRetry] = useState(0);
  const [tab, setTab] = useState<
    "all" | "categories" | "compare" | "methodology"
  >("all");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("rank_asc");
  const [page, setPage] = useState(0);
  const [view, setView] = useState<"grid" | "table">("grid");
  const [isPersian, setIsPersian] = useState(true);
  const [detail, setDetail] = useState<DomainItem | null>(null);
  const [compared, setCompared] = useState<DomainItem[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [cacheOpen, setCacheOpen] = useState(false);
  const [methodOpen, setMethodOpen] = useState(false);
  const detailRequest = useRef(0);
  useEffect(() => {
    document.documentElement.dir = isPersian ? "rtl" : "ltr";
    document.documentElement.lang = isPersian ? "fa" : "en";
  }, [isPersian]);
  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchManifest(), fetchCategories(), fetchCacheStats()])
      .then(([m, c, s]) => {
        if (!cancelled) {
          setManifest(m);
          setCategories(c);
          setCacheStats(s);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [retry]);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    const timer = setTimeout(
      () => {
        fetchDomains(category, search, sort, page, PAGE_SIZE)
          .then((result) => {
            if (!cancelled) {
              setDomains(result.items);
              setTotal(result.total);
            }
          })
          .catch(() => {
            if (!cancelled) setError(true);
          })
          .finally(() => {
            if (!cancelled) setLoading(false);
          });
      },
      search ? 180 : 0,
    );
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [category, search, sort, page, retry]);
  const inspect = async (item: DomainItem) => {
    const request = ++detailRequest.current;
    setDetailLoading(true);
    setDetailError(false);
    try {
      const value = item.historyLoaded
        ? item
        : await fetchDomainDetail(item.domain);
      if (request === detailRequest.current) {
        if (value) setDetail(value);
        else setDetailError(true);
      }
    } catch {
      if (request === detailRequest.current) setDetailError(true);
    } finally {
      if (request === detailRequest.current) setDetailLoading(false);
    }
  };
  const addCompare = async (item: DomainItem) => {
    try {
      const value = item.historyLoaded
        ? item
        : await fetchDomainDetail(item.domain);
      if (value)
        setCompared((previous) =>
          previous.some((d) => d.domain === value.domain) ||
          previous.length >= 5
            ? previous
            : [...previous, value],
        );
    } catch {
      setDetailError(true);
    }
  };
  const toggleCompare = (item: DomainItem) => {
    if (compared.some((d) => d.domain === item.domain))
      setCompared((previous) =>
        previous.filter((d) => d.domain !== item.domain),
      );
    else void addCompare(item);
  };
  const updateDomain = (item: DomainItem) => {
    setDetail(previous => previous?.domain === item.domain ? item : previous);
    setDomains((previous) =>
      previous.map((d) => (d.domain === item.domain ? item : d)),
    );
    setCompared((previous) =>
      previous.map((d) => (d.domain === item.domain ? item : d)),
    );
    void fetchCacheStats().then(setCacheStats);
  };
  const selectCategory = (value: string) => {
    setCategory(value);
    setPage(0);
    setTab("all");
  };
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Header
        currentTab={tab}
        onSelectTab={(value) => {
          if (value === "methodology") setMethodOpen(true);
          else if (value === "compare") setCompareOpen(true);
          else setTab(value);
        }}
        compareCount={compared.length}
        onOpenCompare={() => setCompareOpen(true)}
        onOpenLookup={() => setLookupOpen(true)}
        onOpenCache={() => setCacheOpen(true)}
        cacheStats={cacheStats}
        isPersian={isPersian}
        onToggleLanguage={() => setIsPersian((p) => !p)}
      />
      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <section className="rounded-2xl border border-slate-800 bg-gradient-to-l from-slate-900 to-slate-950 p-6 sm:p-8 space-y-4">
          <p className="text-xs text-cyan-400">Tranco · Iran Hosted Domains</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            {isPersian
              ? "فهرست دامنه‌های ایرانی و تاریخچه رتبه ترنکو"
              : "Iranian domain directory & Tranco history"}
          </h1>
          <p className="text-sm text-slate-400 leading-7">
            {isPersian
              ? "تمام دامنه‌های صریحِ انتشار Iran Hosted Domains، همراه با دامنه‌های منتخب پروژه. این منبع فهرست ثبت رسمی همه دامنه‌های ایرانی نیست. آرشیو پایان ماه و رتبه‌های جدید روزانه از فهرست‌های واقعی ترنکو دریافت می‌شوند."
              : "Every explicit domain in the Iran Hosted Domains release, plus curated project entries. This source is not a registry of every Iranian domain. History combines real month-end archives with new daily lists."}
          </p>
          <div className="flex flex-wrap gap-5 text-xs border-t border-slate-800 pt-4">
            <span>
              <strong className="text-white">
                {manifest?.totalDomains.toLocaleString(
                  isPersian ? "fa-IR" : "en",
                ) || "—"}
              </strong>{" "}
              {isPersian ? "دامنه" : "domains"}
            </span>
            <span>
              <strong className="text-cyan-400">
                {manifest?.rankedDomains.toLocaleString(
                  isPersian ? "fa-IR" : "en",
                ) || "—"}
              </strong>{" "}
              {isPersian
                ? "در آخرین فهرست یک‌میلیونی"
                : "in latest top one million"}
            </span>
            <span>
              {isPersian ? "تاریخ آخرین رتبه:" : "Latest ranking:"}{" "}
              <strong dir="ltr">{manifest?.latestDate || "—"}</strong>
            </span>
            <a
              className="text-cyan-400 underline"
              href="/data/iran-hosted-domains.txt"
              download
            >
              {isPersian
                ? "دانلود کل فهرست منبع"
                : "Download full source directory"}
            </a>
          </div>
          <p className="text-[11px] text-slate-500">
            {isPersian ? "انتشار منبع:" : "Source release:"}{" "}
            {manifest?.source.release || "—"} ·{" "}
            {isPersian ? "مقایسه سالانه با:" : "Annual comparison with:"}{" "}
            {manifest?.yearComparisonDate || "—"}
          </p>
        </section>
        <div className="flex gap-3 text-xs md:hidden">
          <button
            onClick={() => setTab(tab === "categories" ? "all" : "categories")}
          >
            {isPersian ? "دامنه‌ها / دسته‌ها" : "Domains / categories"}
          </button>
          <button onClick={() => setCompareOpen(true)}>
            {isPersian ? "مقایسه" : "Compare"} ({compared.length})
          </button>
          <button onClick={() => setMethodOpen(true)}>
            {isPersian ? "منابع" : "Sources"}
          </button>
        </div>
        {tab === "categories" ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => selectCategory(c.id)}
                className="text-start p-5 rounded-xl border border-slate-800 bg-slate-900 space-y-3"
              >
                <h2 className="font-bold">{isPersian ? c.nameFa : c.nameEn}</h2>
                <p className="text-cyan-400 text-sm">
                  {c.domainCount.toLocaleString()}{" "}
                  {isPersian ? "دامنه" : "domains"}
                </p>
                <p className="text-slate-400 text-xs">
                  {isPersian ? "بالاترین رتبه:" : "Top ranked:"} {c.topDomain}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900">
              <div className="relative flex-1 min-w-52">
                <Search
                  className="absolute start-3 top-2.5 text-slate-500"
                  size={16}
                />
                <input
                  aria-label={
                    isPersian ? "جستجوی همه دامنه‌ها" : "Search all domains"
                  }
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(0);
                  }}
                  placeholder={
                    isPersian
                      ? "جستجو در همه دامنه‌ها..."
                      : "Search all domains..."
                  }
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 py-2 ps-9 pe-3 text-xs"
                />
              </div>
              <select
                aria-label={isPersian ? "دسته‌بندی" : "Category"}
                value={category}
                onChange={(e) => selectCategory(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs max-w-52"
              >
                <option value="all">
                  {isPersian ? "همه دسته‌ها" : "All categories"}
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {isPersian ? c.nameFa : c.nameEn} (
                    {c.domainCount.toLocaleString()})
                  </option>
                ))}
              </select>
              <select
                aria-label={isPersian ? "مرتب‌سازی" : "Sort"}
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as SortOption);
                  setPage(0);
                }}
                className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs"
              >
                {(
                  [
                    "rank_asc",
                    "rank_desc",
                    "growth_1y",
                    "drop_1y",
                    "name_fa",
                    "name_en",
                  ] as SortOption[]
                ).map((s, i) => (
                  <option key={s} value={s}>
                    {isPersian
                      ? [
                          "بهترین رتبه",
                          "رتبه نزولی",
                          "بیشترین رشد یک‌ساله",
                          "بیشترین افت یک‌ساله",
                          "نام فارسی",
                          "نام انگلیسی",
                        ][i]
                      : [
                          "Best rank",
                          "Rank descending",
                          "1Y growth",
                          "1Y decline",
                          "Name (FA)",
                          "Name (EN)",
                        ][i]}
                  </option>
                ))}
              </select>
              <button
                aria-label={isPersian ? "نمای کارت" : "Grid view"}
                onClick={() => setView("grid")}
                className={view === "grid" ? "text-cyan-400" : "text-slate-500"}
              >
                <LayoutGrid size={18} />
              </button>
              <button
                aria-label={isPersian ? "نمای جدول" : "Table view"}
                onClick={() => setView("table")}
                className={
                  view === "table" ? "text-cyan-400" : "text-slate-500"
                }
              >
                <List size={18} />
              </button>
            </div>
            {error ? (
              <div
                role="alert"
                className="p-6 rounded-xl border border-rose-900 text-rose-300 text-sm space-y-3"
              >
                <p>
                  {isPersian
                    ? "بارگذاری داده‌ها انجام نشد. اتصال و فایل‌های داده را بررسی کنید."
                    : "Could not load the dataset. Check the connection and data files."}
                </p>
                <button
                  className="underline"
                  onClick={() => setRetry((n) => n + 1)}
                >
                  {isPersian ? "تلاش دوباره" : "Retry"}
                </button>
              </div>
            ) : loading ? (
              <p role="status" className="py-12 text-center text-cyan-400">
                {isPersian ? "در حال بارگذاری..." : "Loading..."}
              </p>
            ) : (
              <>
                <p className="text-xs text-slate-400">
                  {isPersian
                    ? `نمایش ${total ? page * PAGE_SIZE + 1 : 0} تا ${Math.min((page + 1) * PAGE_SIZE, total)} از ${total.toLocaleString()} نتیجه`
                    : `Showing ${total ? page * PAGE_SIZE + 1 : 0}–${Math.min((page + 1) * PAGE_SIZE, total)} of ${total.toLocaleString()} results`}
                </p>
                {!total ? (
                  <p className="text-center py-12 text-slate-400">
                    {isPersian ? "دامنه‌ای پیدا نشد." : "No domains found."}
                  </p>
                ) : view === "grid" ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {domains.map((d) => (
                      <DomainCard
                        key={d.domain}
                        domain={d}
                        onSelect={inspect}
                        isCompared={compared.some((c) => c.domain === d.domain)}
                        onToggleCompare={toggleCompare}
                        isPersian={isPersian}
                      />
                    ))}
                  </div>
                ) : (
                  <DomainTable
                    domains={domains}
                    onSelect={inspect}
                    comparedDomains={compared}
                    onToggleCompare={toggleCompare}
                    isPersian={isPersian}
                    currentSort={sort}
                    onSortChange={(s) => {
                      setSort(s);
                      setPage(0);
                    }}
                  />
                )}
                <div className="flex items-center justify-center gap-4 text-xs py-3">
                  <button
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                    className="bg-slate-800 rounded px-4 py-2 disabled:opacity-30"
                  >
                    {isPersian ? "قبلی" : "Previous"}
                  </button>
                  <label>
                    {isPersian ? "صفحه" : "Page"}{" "}
                    <input
                      aria-label={isPersian ? "شماره صفحه" : "Page number"}
                      type="number"
                      min={1}
                      max={pages}
                      value={page + 1}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        if (Number.isInteger(n) && n >= 1 && n <= pages)
                          setPage(n - 1);
                      }}
                      className="w-16 bg-slate-900 border border-slate-700 rounded p-2 mx-2"
                    />{" "}
                    / {pages.toLocaleString()}
                  </label>
                  <button
                    disabled={page + 1 >= pages}
                    onClick={() => setPage((p) => p + 1)}
                    className="bg-slate-800 rounded px-4 py-2 disabled:opacity-30"
                  >
                    {isPersian ? "بعدی" : "Next"}
                  </button>
                </div>
              </>
            )}
          </section>
        )}
        <footer className="text-xs text-slate-500 border-t border-slate-800 py-5 flex flex-wrap gap-5">
          <a
            href="https://github.com/bootmortis/iran-hosted-domains"
            target="_blank"
            rel="noreferrer"
          >
            Iran Hosted Domains
          </a>
          <a href="https://tranco-list.eu/" target="_blank" rel="noreferrer">
            Tranco
          </a>
          <button onClick={() => setMethodOpen(true)}>
            {isPersian ? "روش‌شناسی و پوشش داده" : "Methodology & coverage"}
          </button>
        </footer>
      </main>
      {(detailLoading || detailError) && (
        <div
          role="status"
          className="fixed bottom-5 start-1/2 -translate-x-1/2 z-[60] rounded-xl bg-slate-800 border border-slate-600 p-4 text-sm flex gap-3"
        >
          {detailLoading ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : null}
          {detailLoading
            ? isPersian
              ? "دریافت تاریخچه..."
              : "Loading history..."
            : isPersian
              ? "دریافت تاریخچه انجام نشد؛ دوباره تلاش کنید."
              : "History could not be loaded; please retry."}
          <button
            onClick={() => {
              ++detailRequest.current;
              setDetailLoading(false);
              setDetailError(false);
            }}
          >
            ×
          </button>
        </div>
      )}
      {detail && (
        <DomainDetailModal
          key={detail.domain}
          domain={detail}
          onClose={() => setDetail(null)}
          isPersian={isPersian}
          onDomainUpdated={updateDomain}
        />
      )}
      <ComparisonModal
        isOpen={compareOpen}
        onClose={() => setCompareOpen(false)}
        comparedDomains={compared}
        onRemoveDomain={(d) =>
          setCompared((p) => p.filter((x) => x.domain !== d.domain))
        }
        onAddDomain={addCompare}
        onSelectDomain={(d) => {
          setCompareOpen(false);
          void inspect(d);
        }}
        isPersian={isPersian}
      />
      <AddDomainModal
        isOpen={lookupOpen}
        onClose={() => setLookupOpen(false)}
        onDomainAdded={(d) => {
          setLookupOpen(false);
          setDetail(d);
          setRetry(n => n + 1);
        }}
        isPersian={isPersian}
      />
      <CacheManagerModal
        isOpen={cacheOpen}
        onClose={() => setCacheOpen(false)}
        cacheStats={cacheStats}
        onStatsUpdated={setCacheStats}
        onCacheReset={() => {
          setRetry((n) => n + 1);
          setCompared([]);
          setDetail(null);
        }}
        isPersian={isPersian}
      />
      <MethodologyModal
        isOpen={methodOpen}
        onClose={() => setMethodOpen(false)}
        isPersian={isPersian}
      />
    </div>
  );
}

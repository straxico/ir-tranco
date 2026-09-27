import {
  CategoryItem,
  DomainItem,
  CacheStats,
  DataManifest,
  SortOption,
  RankDataPoint,
} from "../types/domain";
import { CATEGORIES } from "../data/iranianDomains";
import metadataJson from "../data/domainMetadata.json";
import { changeAt, mergeHistory } from "../utils/ranks";

type Row = [
  string,
  number | null,
  number | null,
  number | null,
  string | null,
  boolean,
  (string | null)?,
];
type Summary = Pick<
  DomainItem,
  | "currentRank"
  | "rankDate"
  | "rank1yChange"
  | "peakRank"
  | "peakDate"
  | "cachedAt"
>;
type RecentCache = {
  ranks: RankDataPoint[];
  fetchedAt: string;
  summary?: Summary;
};
type Metadata = { titleFa: string; titleEn: string; category: string };
const metadata: Record<string, Metadata> = metadataJson;
const CACHE_KEY = "iran_tranco_recent_v2"; // Old synthetic caches are deliberately ignored.
let manifestPromise: Promise<DataManifest> | undefined;
let directoryPromise: Promise<Row[]> | undefined;
const historyCache = new Map<
  string,
  Promise<Record<string, [number, number][]>>
>();
let hits = 0,
  misses = 0;
let apiStatus: CacheStats["trancoApiStatus"] = "cached_mode";

async function json<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Data request failed (${response.status})`);
  return response.json();
}
export function fetchManifest(): Promise<DataManifest> {
  return (manifestPromise ??= json<DataManifest>("/data/manifest.json").catch(
    (e) => {
      manifestPromise = undefined;
      throw e;
    },
  ));
}
async function directory(): Promise<Row[]> {
  return (directoryPromise ??= fetchManifest()
    .then((m) => json<Row[]>(`/data/${m.assetsPrefix}/directory.json`))
    .catch((e) => {
      directoryPromise = undefined;
      throw e;
    }));
}
function localCache(): Record<string, RecentCache> {
  try {
    const parsed = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([, value]: [string, any]) =>
          value &&
          typeof value.fetchedAt === "string" &&
          Array.isArray(value.ranks) &&
          value.ranks.every(
            (p: any) =>
              typeof p.date === "string" &&
              /^\d{4}-\d{2}-\d{2}$/.test(p.date) &&
              Number.isInteger(p.rank) &&
              p.rank > 0,
          ),
      ),
    ) as Record<string, RecentCache>;
  } catch {
    return {};
  }
}
function rowItem(row: Row, m: DataManifest): DomainItem {
  const [domain, rank, change, peak, peakDate, fromSource, coverageStart] = row;
  const labels = metadata[domain];
  const category = labels?.category || "uncategorized";
  return {
    domain,
    titleFa: labels?.titleFa || domain,
    titleEn: labels?.titleEn || domain,
    descriptionFa: fromSource
      ? "ثبت‌شده در فهرست عمومی Iran Hosted Domains"
      : "دامنه افزوده‌شده به فهرست پروژه",
    descriptionEn: fromSource
      ? "Included in the Iran Hosted Domains release"
      : "Curated project domain",
    category,
    categoryFa: CATEGORIES.find((c) => c.id === category)?.nameFa || category,
    currentRank: rank,
    rankStatus:
      coverageStart && coverageStart > m.latestDate
        ? "not_collected"
        : rank == null
          ? "unranked"
          : "ranked",
    rankDate: m.latestDate,
    rank1yChange: change,
    rank30dAvg: null,
    rank30dChange: null,
    rank5yChange: null,
    peakRank: peak,
    peakDate: peakDate || "—",
    history: [],
    cachedAt: m.generatedAt,
    hosting: {
      asn: "—",
      provider: "—",
      ip: "—",
      bootmortisVerified: fromSource,
      reverseProxy: false,
      sslIssuer: "—",
      cdn: "—",
      location: "—",
    },
    trancoLive: false,
    dataSource: peak == null ? "bootmortis_index" : "tranco_cached",
  };
}

export async function fetchCategories(): Promise<CategoryItem[]> {
  const rows = await directory();
  const counts = new Map<string, number>();
  const top = new Map<string, Row>();
  for (const row of rows) {
    const category = metadata[row[0]]?.category || "uncategorized";
    counts.set(category, (counts.get(category) || 0) + 1);
    if (
      row[1] != null &&
      (!top.has(category) || row[1] < top.get(category)![1]!)
    )
      top.set(category, row);
  }
  return CATEGORIES.map((c) => ({
    ...c,
    domainCount: counts.get(c.id) || 0,
    topDomain: top.get(c.id)?.[0] || "—",
  }));
}

export async function fetchDomains(
  category = "all",
  search = "",
  sort: SortOption = "rank_asc",
  page = 0,
  pageSize = 60,
): Promise<{ items: DomainItem[]; total: number }> {
  const [baseRows, m] = await Promise.all([directory(), fetchManifest()]);
  const recent = localCache();
  const present = new Set(baseRows.map((r) => r[0]));
  const rows: Row[] = [
    ...baseRows,
    ...Object.keys(recent)
      .filter((d) => !present.has(d))
      .map((d) => [d, null, null, null, null, false] as Row),
  ].map((row) => {
    const summary = recent[row[0]]?.summary;
    return summary && summary.rankDate >= m.latestDate
      ? [
          row[0],
          summary.currentRank,
          summary.rank1yChange,
          summary.peakRank,
          summary.peakDate,
          row[5],
          row[6],
        ]
      : row;
  });
  const query = search.trim().toLowerCase();
  const filtered = rows.filter((row) => {
    const labels = metadata[row[0]];
    return (
      (category === "all" ||
        (labels?.category || "uncategorized") === category) &&
      (!query ||
        row[0].includes(query) ||
        labels?.titleFa.toLowerCase().includes(query) ||
        labels?.titleEn.toLowerCase().includes(query))
    );
  });
  filtered.sort((a, b) => {
    if (sort === "name_fa" || sort === "name_en") {
      const field = sort === "name_fa" ? "titleFa" : "titleEn";
      return (metadata[a[0]]?.[field] || a[0]).localeCompare(
        metadata[b[0]]?.[field] || b[0],
        sort === "name_fa" ? "fa" : "en",
      );
    }
    const index = sort === "growth_1y" || sort === "drop_1y" ? 2 : 1;
    const av = a[index],
      bv = b[index];
    if (av == null || bv == null)
      return av == null && bv == null
        ? a[0].localeCompare(b[0])
        : av == null
          ? 1
          : -1;
    const direction = sort === "rank_desc" || sort === "growth_1y" ? -1 : 1;
    return (av - bv) * direction || a[0].localeCompare(b[0]);
  });
  return {
    total: filtered.length,
    items: filtered.slice(page * pageSize, (page + 1) * pageSize).map((row) => {
      const item = rowItem(row, m);
      const summary = recent[row[0]]?.summary;
      return summary && summary.rankDate >= m.latestDate
        ? {
            ...item,
            ...summary,
            trancoLive: true,
            dataSource: "tranco_api" as const,
          }
        : item;
    }),
  };
}

function applyHistory(item: DomainItem, history: RankDataPoint[]): DomainItem {
  const ranked = history.filter((p) => p.rank != null);
  const peak = ranked.reduce<RankDataPoint | undefined>(
    (best, p) => (!best || p.rank! < best.rank! ? p : best),
    undefined,
  );
  const latest = history[history.length - 1];
  return {
    ...item,
    history,
    historyLoaded: true,
    currentRank: latest?.rank ?? null,
    rankStatus: latest?.status || "not_collected",
    rankDate: latest?.date || item.rankDate,
    peakRank: peak?.rank ?? null,
    peakDate: peak?.date || "—",
    rank1yChange: changeAt(history, 12),
    rank30dChange: changeAt(history, 1),
    rank5yChange: changeAt(history, 60),
  };
}

export async function fetchDomainDetail(
  domain: string,
): Promise<DomainItem | null> {
  const [rows, m] = await Promise.all([directory(), fetchManifest()]);
  const name = domain.toLowerCase();
  const row = rows.find((r) => r[0] === name);
  const recent = localCache()[name];
  if (!row && !recent) return null;
  const item = rowItem(row || [name, null, null, null, null, false], m);
  const shard = (Array.from(name).reduce((n, c) => n + c.charCodeAt(0), 0) % 64)
    .toString(16)
    .padStart(2, "0");
  if (!historyCache.has(shard)) {
    misses++;
    historyCache.set(
      shard,
      json<Record<string, [number, number][]>>(
        `/data/${m.assetsPrefix}/history/${shard}.json`,
      ).catch((e) => {
        historyCache.delete(shard);
        throw e;
      }),
    );
  } else hits++;
  const data = await historyCache.get(shard)!;
  const ranks = new Map(data[name] || []);
  const archive: RankDataPoint[] = m.snapshots.map((s, i) => ({
    date: s.date,
    listId: s.listId,
    rank: ranks.get(i) ?? null,
    status:
      !row || (row[6] && s.date < row[6])
        ? "not_collected"
        : s.status === "unavailable"
          ? "unavailable"
          : ranks.has(i)
            ? "ranked"
            : "unranked",
  }));
  const result = applyHistory(item, mergeHistory(archive, recent?.ranks || []));
  return recent
    ? {
        ...result,
        cachedAt: recent.fetchedAt,
        trancoLive: true,
        dataSource: "tranco_api",
      }
    : result;
}

export async function lookupDomain(
  value: string,
): Promise<{ domain: DomainItem; cached: boolean }> {
  const domain = normalizeDomain(value);
  const existing = await fetchDomainDetail(domain);
  if (existing) return { domain: existing, cached: true };
  return { domain: await refreshDomainCache(domain), cached: false };
}
export function normalizeDomain(value: string): string {
  const url = new URL(value.includes("://") ? value : `https://${value}`);
  const domain = url.hostname.toLowerCase().replace(/\.$/, "");
  if (
    domain.length > 253 ||
    !domain.includes(".") ||
    !domain
      .split(".")
      .every((p) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(p))
  )
    throw new Error("Invalid domain");
  return domain;
}
export async function refreshDomainCache(value: string): Promise<DomainItem> {
  const domain = normalizeDomain(value);
  const response = await fetch(
    `/api/tranco?domain=${encodeURIComponent(domain)}`,
  );
  if (!response.ok) {
    apiStatus = response.status === 429 ? "rate_limited" : "cached_mode";
    throw new Error(
      response.status === 429
        ? "Tranco rate limit; retry shortly."
        : "Tranco refresh failed. Archived history is still available.",
    );
  }
  const data = await response.json();
  if (!Array.isArray(data.ranks) || !data.ranks.length)
    throw new Error("No recent Tranco ranks found.");
  const recent: RankDataPoint[] = data.ranks
    .filter(
      (r: any) =>
        /^\d{4}-\d{2}-\d{2}$/.test(r.date) &&
        Number.isInteger(r.rank) &&
        r.rank > 0,
    )
    .map((r: any) => ({
      date: r.date,
      rank: r.rank,
      status: "ranked" as const,
    }));
  if (!recent.length) throw new Error("Invalid Tranco response");
  // Load archive first. A network/cache failure must not erase historical points.
  const old = await fetchDomainDetail(domain);
  const m = await fetchManifest();
  const item = old || rowItem([domain, null, null, null, null, false], m);
  const fetchedAt = new Date().toISOString();
  const cache = localCache();
  const result: DomainItem = {
    ...applyHistory(item, mergeHistory(item.history, recent)),
    cachedAt: fetchedAt,
    trancoLive: true,
    dataSource: "tranco_api",
    isCustom: !old,
  };
  const { currentRank, rankDate, rank1yChange, peakRank, peakDate, cachedAt } =
    result;
  cache[domain] = {
    ranks: mergeHistory(cache[domain]?.ranks || [], recent),
    fetchedAt,
    summary: {
      currentRank,
      rankDate,
      rank1yChange,
      peakRank,
      peakDate,
      cachedAt,
    },
  };
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* in-memory result remains usable */
  }
  apiStatus = "online";
  return result;
}
export async function fetchCompareDomains(
  domains: string[],
): Promise<DomainItem[]> {
  return (await Promise.all(domains.map(fetchDomainDetail))).filter(
    (d): d is DomainItem => !!d,
  );
}
export async function fetchCacheStats(): Promise<CacheStats> {
  const m = await fetchManifest();
  return {
    totalDomains: m.totalDomains,
    cachedEntries: m.domainsWithHistory,
    hitCount: hits,
    missCount: misses,
    hitRate: hits + misses ? Math.round((hits / (hits + misses)) * 100) : 0,
    lastSync: m.generatedAt,
    trancoApiStatus: apiStatus,
  };
}
export async function resetCache(): Promise<void> {
  localStorage.removeItem(CACHE_KEY);
  historyCache.clear();
  hits = 0;
  misses = 0;
  apiStatus = "cached_mode";
}

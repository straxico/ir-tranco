export interface RankDataPoint {
  date: string;
  rank: number | null;
  listId?: string;
  status?: "ranked" | "unranked" | "unavailable" | "not_collected";
}
export interface HostingInfo {
  asn: string;
  provider: string;
  ip: string;
  bootmortisVerified: boolean;
  reverseProxy: boolean;
  sslIssuer: string;
  cdn: string;
  location: string;
}
export interface DomainItem {
  domain: string;
  titleFa: string;
  titleEn: string;
  descriptionFa: string;
  descriptionEn: string;
  category: string;
  categoryFa: string;
  currentRank: number | null;
  rankDate: string;
  rankStatus?: RankDataPoint["status"];
  rank30dAvg: number | null;
  rank30dChange: number | null;
  rank1yChange: number | null;
  rank5yChange: number | null;
  peakRank: number | null;
  peakDate: string;
  history: RankDataPoint[];
  historyLoaded?: boolean;
  hosting: HostingInfo;
  cachedAt: string;
  isCustom?: boolean;
  trancoLive?: boolean;
  dataSource?: "tranco_api" | "tranco_cached" | "bootmortis_index";
}
export interface CategoryItem {
  id: string;
  nameFa: string;
  nameEn: string;
  icon: string;
  descriptionFa: string;
  domainCount: number;
  topDomain: string;
}
export interface CacheStats {
  totalDomains: number;
  cachedEntries: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  lastSync: string;
  trancoApiStatus: "online" | "rate_limited" | "cached_mode";
}
export interface DataManifest {
  schemaVersion: number;
  generatedAt: string;
  assetsPrefix: string;
  totalDomains: number;
  rankedDomains: number;
  domainsWithHistory: number;
  latestDate: string;
  dailySince?: string;
  yearComparisonDate: string | null;
  source: {
    repository: string;
    url: string;
    release: string;
    publishedAt: string;
    domainCount: number;
    sha256: string;
  };
  snapshots: {
    date: string;
    status: "available" | "unavailable";
    listId?: string;
  }[];
}
export type SortOption =
  "rank_asc" | "rank_desc" | "growth_1y" | "drop_1y" | "name_fa" | "name_en";
export type TimeRange = "6m" | "1y" | "3y" | "all";

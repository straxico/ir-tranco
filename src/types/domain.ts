export interface RankDataPoint {
  date: string; // YYYY-MM
  rank: number;
  listId?: string;
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
  currentRank: number;
  rank30dAvg: number;
  rank30dChange: number; // positive = rank improved (e.g. from 5000 to 4500 is +500)
  rank1yChange: number;
  rank5yChange: number;
  peakRank: number;
  peakDate: string;
  history: RankDataPoint[];
  hosting: HostingInfo;
  cachedAt: string;
  isCustom?: boolean;
  trancoLive?: boolean;
  dataSource?: 'tranco_api' | 'tranco_cached' | 'bootmortis_index';
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
  trancoApiStatus: 'online' | 'rate_limited' | 'cached_mode';
}

export type SortOption =
  | 'rank_asc'
  | 'rank_desc'
  | 'growth_1y'
  | 'drop_1y'
  | 'name_fa'
  | 'name_en';

export type TimeRange = '6m' | '1y' | '3y' | 'all';

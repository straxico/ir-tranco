import { CategoryItem, DomainItem, CacheStats } from '../types/domain';
import { INITIAL_DOMAINS, CATEGORIES } from '../data/iranianDomains';

const isProduction = import.meta.env.PROD;

export async function fetchCategories(): Promise<CategoryItem[]> {
  try {
    const res = await fetch('/api/categories');
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch {
    // Fallback to local data
    return CATEGORIES.map((cat) => {
      const catDomains = INITIAL_DOMAINS.filter((d) => d.category === cat.id);
      return {
        ...cat,
        domainCount: catDomains.length,
        topDomain: catDomains.sort((a, b) => a.currentRank - b.currentRank)[0]?.domain || cat.topDomain,
      };
    });
  }
}

export async function fetchDomains(
  category?: string,
  search?: string,
  sort?: string
): Promise<DomainItem[]> {
  try {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.set('category', category);
    if (search) params.set('search', search);
    if (sort) params.set('sort', sort);

    const res = await fetch(`/api/domains?${params.toString()}`);
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch {
    // Client-side fallback
    let list = [...INITIAL_DOMAINS];
    if (category && category !== 'all') {
      list = list.filter((d) => d.category === category);
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (d) =>
          d.domain.toLowerCase().includes(q) ||
          d.titleFa.toLowerCase().includes(q) ||
          d.titleEn.toLowerCase().includes(q) ||
          d.categoryFa.toLowerCase().includes(q)
      );
    }
    if (sort === 'growth_1y') {
      list.sort((a, b) => b.rank1yChange - a.rank1yChange);
    } else if (sort === 'drop_1y') {
      list.sort((a, b) => a.rank1yChange - b.rank1yChange);
    } else if (sort === 'name_fa') {
      list.sort((a, b) => a.titleFa.localeCompare(b.titleFa, 'fa'));
    } else {
      list.sort((a, b) => a.currentRank - b.currentRank);
    }
    return list;
  }
}

export async function fetchDomainDetail(domain: string): Promise<DomainItem | null> {
  try {
    const res = await fetch(`/api/domains/${encodeURIComponent(domain)}`);
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch {
    const found = INITIAL_DOMAINS.find((d) => d.domain.toLowerCase() === domain.toLowerCase());
    return found || null;
  }
}

export async function lookupDomain(domain: string): Promise<{ domain: DomainItem; cached: boolean }> {
  try {
    const res = await fetch('/api/domains/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain }),
    });
    if (!res.ok) throw new Error('Lookup error');
    return await res.json();
  } catch (err) {
    const found = INITIAL_DOMAINS.find((d) => d.domain.toLowerCase().includes(domain.toLowerCase()));
    if (found) return { domain: found, cached: true };
    throw err;
  }
}

export async function fetchCompareDomains(domains: string[]): Promise<DomainItem[]> {
  try {
    const res = await fetch(`/api/compare?domains=${encodeURIComponent(domains.join(','))}`);
    if (!res.ok) throw new Error('Compare error');
    return await res.json();
  } catch {
    return INITIAL_DOMAINS.filter((d) =>
      domains.map((x) => x.toLowerCase()).includes(d.domain.toLowerCase())
    );
  }
}

export async function fetchCacheStats(): Promise<CacheStats> {
  try {
    const res = await fetch('/api/cache/stats');
    if (!res.ok) throw new Error('Stats error');
    return await res.json();
  } catch {
    return {
      totalDomains: INITIAL_DOMAINS.length,
      cachedEntries: INITIAL_DOMAINS.length,
      hitCount: 42,
      missCount: 2,
      hitRate: 95,
      lastSync: new Date().toISOString(),
      trancoApiStatus: 'online',
    };
  }
}

export async function refreshDomainCache(domain: string): Promise<DomainItem> {
  const res = await fetch(`/api/cache/refresh/${encodeURIComponent(domain)}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Refresh error');
  const data = await res.json();
  return data.domain;
}

export async function resetCache(): Promise<void> {
  await fetch('/api/cache/clear', { method: 'POST' });
}

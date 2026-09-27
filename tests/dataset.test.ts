import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fetchDomains, fetchDomainDetail, fetchCategories, fetchManifest, refreshDomainCache, resetCache } from '../src/services/api.ts';

const root = path.resolve(import.meta.dirname, '..');
const memory = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => { memory.set(key, value); },
  removeItem: (key: string) => { memory.delete(key); },
} });
const originalFetch = globalThis.fetch;
let refreshRanks: { date: string; rank: number }[] = [];
globalThis.fetch = async input => {
  const url = String(input);
  if (url.startsWith('/api/tranco')) return Response.json({ ranks: refreshRanks });
  try { return new Response(readFileSync(path.join(root, 'public', url)), { headers: { 'content-type': 'application/json' } }); }
  catch { return new Response('missing', { status: 404 }); }
};

test('published dataset supports all source domains, pagination, null ranks and non-destructive refresh', async () => {
  try {
    const m = await fetchManifest();
    const source = readFileSync(path.join(root, 'public/data/iran-hosted-domains.txt'), 'utf8').trim().split('\n');
    assert.equal(source.length, m.source.domainCount);
    const rows: [string, number | null, number | null, number | null, string | null, boolean][] = JSON.parse(readFileSync(path.join(root, 'public/data', m.assetsPrefix, 'directory.json'), 'utf8'));
    assert.equal(new Set(rows.map(r => r[0])).size, m.totalDomains);
    const imported = new Set(rows.filter(r => r[5]).map(r => r[0]));
    for (const domain of source) assert.ok(imported.has(domain), `Missing source domain ${domain}`);
    const first = await fetchDomains('all', '', 'rank_asc', 0);
    const second = await fetchDomains('all', '', 'rank_asc', 1);
    assert.equal(first.total, m.totalDomains);
    assert.equal(first.items.length, 60);
    assert.equal(second.items.length, 60);
    assert.ok(!second.items.some(d => first.items.some(a => a.domain === d.domain)));
    const tail = source[source.length - 1];
    assert.ok((await fetchDomains('all', tail)).items.some(d => d.domain === tail));
    assert.equal((await fetchCategories()).reduce((n, c) => n + c.domainCount, 0), m.totalDomains);

    const absent = rows.find(r => r[3] == null)!;
    const unranked = (await fetchDomainDetail(absent[0]))!;
    assert.equal(unranked.currentRank, null);
    assert.equal(unranked.peakRank, null);
    assert.equal(unranked.rank1yChange, null);
    assert.equal(unranked.history.length, m.snapshots.length);
    assert.ok(unranked.history.some(p => p.status === 'unranked'));
    for (const [i, point] of unranked.history.entries()) {
      assert.equal(point.status, m.snapshots[i].status === 'unavailable' ? 'unavailable' : 'unranked');
    }

    const before = (await fetchDomainDetail('aparat.com'))!;
    assert.ok(before.history.some(p => p.date.startsWith('2019-') && p.rank != null));
    const future = new Date(`${m.latestDate}T00:00:00Z`);
    future.setUTCDate(future.getUTCDate() + 1);
    const nextDate = future.toISOString().slice(0, 10);
    refreshRanks = [{ date: nextDate, rank: 1234 }];
    const refreshed = await refreshDomainCache('aparat.com');
    assert.equal(refreshed.currentRank, 1234);
    assert.equal(refreshed.history.length, before.history.length + 1);
    assert.deepEqual(refreshed.history.slice(0, -1), before.history);
    assert.equal((await fetchDomains('all', 'aparat.com')).items.find(d => d.domain === 'aparat.com')!.currentRank, 1234);

    // A newly looked-up domain was never scanned against the archive.
    const custom = 'test-not-in-source.example';
    await refreshDomainCache(custom);
    const detail = (await fetchDomainDetail(custom))!;
    assert.ok(detail.history.filter(p => p.date !== nextDate).every(p => p.status === 'not_collected'));
    assert.equal((await fetchDomains('all', custom)).total, 1);
    await resetCache();
    assert.equal((await fetchDomainDetail('aparat.com'))!.history.length, before.history.length);
    assert.equal(await fetchDomainDetail(custom), null);
    assert.equal((await fetchDomains()).total, m.totalDomains);
  } finally { globalThis.fetch = originalFetch; }
});

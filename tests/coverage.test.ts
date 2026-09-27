import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchDomainDetail, fetchDomains } from '../src/services/api.ts';

Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => null } });
const originalFetch = globalThis.fetch;
const snapshots = ['2019-02-28', '2026-09-24', '2026-09-25', '2026-09-26'].map(date => ({date, status: 'available', listId: 'list-' + date}));
globalThis.fetch = async input => {
  const url = String(input);
  if (url.endsWith('manifest.json')) return Response.json({ schemaVersion: 2, assetsPrefix: 'test', latestDate: '2026-09-26', snapshots });
  if (url.endsWith('directory.json')) return Response.json([
    ['new.ir', null, null, 42, '2026-09-25', true, '2026-09-25'],
    ['pending.ir', null, null, null, null, true, '2026-09-27'],
  ]);
  return Response.json({'new.ir': [[2, 42]]});
};
test('new source domains distinguish uncollected history from actual absence in a collected list', async () => {
  try {
    const domain = (await fetchDomainDetail('new.ir'))!;
    assert.deepEqual(domain.history.map(p => p.status), ['not_collected', 'not_collected', 'ranked', 'unranked']);
    assert.equal(domain.currentRank, null);
    assert.equal(domain.rankStatus, 'unranked');
    assert.equal(domain.peakRank, 42);
    const pending = (await fetchDomainDetail('pending.ir'))!;
    assert.ok(pending.history.every(p => p.status === 'not_collected'));
    assert.equal(pending.rankStatus, 'not_collected');
    assert.equal((await fetchDomains('all', 'pending.ir')).items[0].rankStatus, 'not_collected');
  } finally { globalThis.fetch = originalFetch; }
});

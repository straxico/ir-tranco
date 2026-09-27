#!/usr/bin/env python3
"""Validate the complete published dataset before a scheduled commit."""
import json
from datetime import date, datetime, timezone
from pathlib import Path
import sync_data as sync


def validate():
    manifest, rows, snapshots, coverage = sync.load_published()
    assert manifest, 'No published dataset'
    assert manifest['schemaVersion'] == 2, 'Unsupported schema'
    dates = [s['date'] for s in snapshots]
    assert dates == sorted(set(dates)), 'Duplicate or unsorted snapshots'
    assert all(date.fromisoformat(d) <= datetime.now(timezone.utc).date() for d in dates), 'Future snapshot'
    domains = {r[0] for r in rows}
    assert len(domains) == len(rows) == manifest['totalDomains'], 'Directory count mismatch'
    assert all(sync.normalize_domain(d) == d for d in domains), 'Invalid domain'
    source = set((sync.OUTPUT / 'iran-hosted-domains.txt').read_text().splitlines())
    assert source == {r[0] for r in rows if r[5]}, 'Source membership mismatch'
    assert len(source) == manifest['source']['domainCount'], 'Source count mismatch'
    latest = next(s for s in snapshots if s['date'] == manifest['latestDate'])
    assert latest['status'] == 'available', 'Latest list is unavailable'
    old = sync.prior_snapshot(snapshots, date.fromisoformat(latest['date']), 12)
    assert manifest['yearComparisonDate'] == (old['date'] if old else None)
    peaks = {}
    observations = 0
    for snapshot in snapshots:
        assert snapshot['status'] in ('available', 'unavailable')
        if snapshot['status'] == 'available':
            assert snapshot.get('listId'), 'Available snapshot without provenance'
        else:
            assert not snapshot['ranks'], 'Ranks in an unavailable list'
        for domain, rank in snapshot['ranks'].items():
            assert domain in domains, 'History domain missing from directory'
            assert type(rank) is int and 1 <= rank <= 1_000_000, 'Invalid rank'
            assert domain not in coverage or snapshot['date'] >= coverage[domain], 'Rank before coverage start'
            observations += 1
            if domain not in peaks or rank < peaks[domain][0]:
                peaks[domain] = (rank, snapshot['date'])
    for row in rows:
        domain, rank, change, best, best_date, *_ = row
        assert rank == latest['ranks'].get(domain), f'Current rank mismatch: {domain}'
        previous = old['ranks'].get(domain) if old else None
        expected = previous - rank if previous is not None and rank is not None else None
        assert change == expected, f'Annual change mismatch: {domain}'
        assert (best, best_date) == peaks.get(domain, (None, None)), f'Peak mismatch: {domain}'
    assert manifest['rankedDomains'] == len(latest['ranks'])
    assert manifest['domainsWithHistory'] == len(peaks)
    print(f"Validated {len(rows):,} domains, {len(snapshots)} snapshots, {observations:,} observed ranks.")


if __name__ == '__main__':
    validate()

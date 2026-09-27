#!/usr/bin/env python3
"""Build a reproducible static directory and monthly Tranco history, using stdlib only."""
import argparse
import calendar
import csv
import hashlib
import io
import json
import re
import shutil
import time
import threading
import zipfile
from concurrent.futures import ThreadPoolExecutor, as_completed
import urllib.error
import urllib.request
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.data-cache'
OUTPUT = ROOT / 'public/data'
RELEASE_API = 'https://api.github.com/repos/bootmortis/iran-hosted-domains/releases/latest'
SOURCE_REPO = 'https://github.com/bootmortis/iran-hosted-domains'
TRANCO = 'https://tranco-list.eu'
API_LOCK = threading.Lock()
API_LAST = 0.0


def utcnow():
    return datetime.now(timezone.utc).isoformat()


def request(url):
    for attempt in range(4):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers={
                'User-Agent': 'ir-tranco-history/1.0', 'Accept': '*/*',
            }), timeout=60)
        except urllib.error.HTTPError as exc:
            if exc.code not in (429, 500, 502, 503, 504) or attempt == 3:
                raise
        except (TimeoutError, urllib.error.URLError):
            if attempt == 3:
                raise
        time.sleep(2 ** (attempt + 1))


def get_json(url):
    global API_LAST
    if url.startswith(TRANCO):
        with API_LOCK:
            time.sleep(max(0, 1.05 - (time.monotonic() - API_LAST)))
            API_LAST = time.monotonic()
            with request(url) as response:
                return json.load(response)
    with request(url) as response:
        return json.load(response)


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix('.tmp')
    temp.write_text(json.dumps(value, ensure_ascii=False, separators=(',', ':')) + '\n')
    temp.replace(path)


def normalize_domain(value):
    value = value.strip().lower().rstrip('.')
    try:
        value = value.encode('idna').decode('ascii')
    except UnicodeError:
        return None
    if len(value) > 253 or '.' not in value:
        return None
    if not all(re.fullmatch(r'[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?', s) for s in value.split('.')):
        return None
    if all(s.isdigit() for s in value.split('.')):
        return None
    return value


def load_source(previous=None):
    release = get_json(RELEASE_API)
    source_file = OUTPUT / 'iran-hosted-domains.txt'
    if previous and release['tag_name'] == previous['source']['release'] and source_file.exists():
        return set(source_file.read_text().splitlines()), previous['source']
    assets = {a['name']: a['browser_download_url'] for a in release['assets']}
    with request(assets['domains.txt']) as response:
        raw = response.read()
    with request(assets['domains.txt.sha256']) as response:
        expected = response.read().decode().split()[0].lower()
    digest = hashlib.sha256(raw).hexdigest()
    if expected != digest:
        raise ValueError('Source checksum mismatch; keeping the previous dataset')
    domains, ignored = set(), []
    for line in raw.decode('utf-8-sig').splitlines():
        if not line.strip() or line.lstrip().startswith('#'):
            continue
        domain = normalize_domain(line)
        if domain:
            domains.add(domain)
        else:
            ignored.append(line)
    if not domains:
        raise ValueError('Empty domain source')
    return domains, {
        'repository': SOURCE_REPO, 'url': assets['domains.txt'],
        'release': release['tag_name'], 'publishedAt': release['published_at'],
        'fetchedAt': utcnow(), 'sha256': digest, 'domainCount': len(domains),
        'ignoredEntries': ignored,
        'scope': 'All explicit hostnames in the Iran Hosted Domains release; not a registry of every Iranian domain.',
    }


def month_ends(start, end):
    current = start.replace(day=1)
    while current <= end:
        last = current.replace(day=calendar.monthrange(current.year, current.month)[1])
        if last <= end:
            yield last
        current = (last + timedelta(days=1))


def extract_ranks(lines, domains):
    ranks = {}
    count = 0
    for row in csv.reader(lines):
        if len(row) != 2 or int(row[0]) != count + 1:
            raise ValueError('Malformed or truncated Tranco CSV')
        count += 1
        if row[1] in domains:
            ranks[row[1]] = count
    if count != 1_000_000:
        raise ValueError(f'Expected one million Tranco rows, got {count}')
    return ranks


def fetch_snapshot(day, domains, domain_hash, metadata=None):
    key = day.strftime('%Y%m%d') if isinstance(day, date) else day
    # Resolve latest every run; completed dated snapshots are immutable.
    cached = CACHE / domain_hash / f'{key}.json'
    if metadata is None and key != 'latest' and cached.exists():
        return json.loads(cached.read_text())
    try:
        meta = metadata or get_json(f'{TRANCO}/api/lists/date/{key}')
    except urllib.error.HTTPError as exc:
        if exc.code != 404 or key == 'latest':
            raise
        # A missing list is not evidence that a domain was outside the ranking.
        return {'date': day.isoformat(), 'status': 'unavailable', 'ranks': {}}
    if not meta.get('available'):
        raise ValueError(f'List {key} is not yet available; retry later')
    list_id = meta['list_id']
    actual_date = meta['configuration']['endDate']
    if key != 'latest' and actual_date != day.isoformat():
        raise ValueError(f'Unexpected snapshot date {actual_date} for {key}')
    by_id = CACHE / domain_hash / f'id-{list_id}.json'
    if by_id.exists():
        snapshot = json.loads(by_id.read_text())
    else:
        download = meta['download']
        if not download.startswith(f'{TRANCO}/download/'):
            raise ValueError('Unexpected Tranco download host')
        # Same ZIP endpoint used by the official tranco Python package.
        try:
            with request(f'{TRANCO}/download_daily/{list_id}') as response:
                payload = response.read()
            with zipfile.ZipFile(io.BytesIO(payload)) as archive:
                with archive.open('top-1m.csv') as stream:
                    ranks = extract_ranks(io.TextIOWrapper(stream, encoding='utf-8'), domains)
        except urllib.error.HTTPError as exc:
            if exc.code != 404:
                raise
            with request(download) as response:
                ranks = extract_ranks(io.TextIOWrapper(response, encoding='utf-8'), domains)
        snapshot = {'date': actual_date, 'status': 'available', 'listId': list_id,
                    'download': download, 'fetchedAt': utcnow(), 'ranks': ranks}
        write_json(by_id, snapshot)
    if key != 'latest':
        write_json(cached, snapshot)
    time.sleep(1.05)
    return snapshot


def bucket(domain):
    return f'{sum(map(ord, domain)) % 64:02x}'


def prior_snapshot(snapshots, latest_date, months):
    year, month = divmod(latest_date.year * 12 + latest_date.month - 1 - months, 12)
    target = date(year, month + 1, min(latest_date.day, calendar.monthrange(year, month + 1)[1]))
    candidates = [s for s in snapshots
                  if 0 <= (target - date.fromisoformat(s['date'])).days <= 31]
    selected = max(candidates, key=lambda s: s['date']) if candidates else None
    return selected if selected and selected['status'] == 'available' else None


def export_data(domains, source_domains, source, snapshots, coverage=None, daily_since=None):
    coverage = coverage or {}
    previous_manifest = json.loads((OUTPUT / "manifest.json").read_text()) if (OUTPUT / "manifest.json").exists() else None
    snapshots = sorted({s['date']: s for s in snapshots}.values(), key=lambda s: s['date'])
    latest = next(s for s in reversed(snapshots) if s['status'] == 'available')
    old = prior_snapshot(snapshots, date.fromisoformat(latest['date']), 12)
    histories = {f'{n:02x}': {} for n in range(64)}
    peak = {}
    for index, snapshot in enumerate(snapshots):
        snapshot['ranks'] = {d: r for d, r in snapshot['ranks'].items() if d in domains}
        for domain, rank in snapshot['ranks'].items():
            histories[bucket(domain)].setdefault(domain, []).append([index, rank])
            if domain not in peak or rank < peak[domain][0]:
                peak[domain] = (rank, snapshot['date'])
    rows = []
    for domain in sorted(domains):
        rank = latest['ranks'].get(domain)
        previous = old['ranks'].get(domain) if old else None
        best, best_date = peak.get(domain, (None, None))
        rows.append([domain, rank, previous - rank if previous is not None and rank is not None else None,
                     best, best_date, domain in source_domains, coverage.get(domain)])
    version = hashlib.sha256(json.dumps([source['sha256'], sorted(domains), coverage, snapshots], sort_keys=True).encode()).hexdigest()[:16]
    prefix = f'snapshots/{version}'
    folder = OUTPUT / prefix
    write_json(folder / 'directory.json', rows)
    for shard, value in histories.items():
        write_json(folder / 'history' / f'{shard}.json', value)
    manifest = {
        'schemaVersion': 2, 'generatedAt': utcnow(), 'assetsPrefix': prefix,
        'source': source, 'totalDomains': len(domains),
        'rankedDomains': len(latest['ranks']), 'domainsWithHistory': len(peak),
        'latestDate': latest['date'], 'yearComparisonDate': old['date'] if old else None,
        'sampling': 'Historical month-end snapshots, then incremental daily lists; not monthly averages.',
        'dailySince': daily_since or latest['date'],
        'snapshots': [{k: v for k, v in s.items() if k != 'ranks'} for s in snapshots],
    }
    temp_source = OUTPUT / 'iran-hosted-domains.tmp'
    temp_source.write_text('\n'.join(sorted(source_domains)) + '\n')
    temp_source.replace(OUTPUT / 'iran-hosted-domains.txt')
    write_json(OUTPUT / 'manifest.json', manifest)
    # Keep only the current and preceding immutable generation in the working tree.
    # Git itself retains older generations. Existing browser sessions can finish loading.
    keep = {folder.name}
    if previous_manifest:
        keep.add(Path(previous_manifest['assetsPrefix']).name)
    for old_folder in (OUTPUT / 'snapshots').iterdir():
        if old_folder.is_dir() and old_folder.name not in keep:
            shutil.rmtree(old_folder)
    print(json.dumps({k: manifest[k] for k in ['totalDomains', 'rankedDomains', 'domainsWithHistory', 'latestDate']}), flush=True)


def load_published():
    """Restore observations from Git; no network or runner-local cache is needed."""
    manifest_file = OUTPUT / 'manifest.json'
    if not manifest_file.exists():
        return None, [], [], {}
    manifest = json.loads(manifest_file.read_text())
    folder = OUTPUT / manifest['assetsPrefix']
    if not folder.resolve().is_relative_to(OUTPUT.resolve()):
        raise ValueError('Invalid dataset asset path')
    rows = json.loads((folder / 'directory.json').read_text())
    snapshots = [{**s, 'ranks': {}} for s in manifest['snapshots']]
    for shard in range(64):
        histories = json.loads((folder / 'history' / f'{shard:02x}.json').read_text())
        for domain, points in histories.items():
            if bucket(domain) != f'{shard:02x}':
                raise ValueError('History is stored in the wrong shard')
            previous_index = -1
            for index, rank in points:
                if (type(index) is not int or not previous_index < index < len(snapshots)
                        or type(rank) is not int or not 1 <= rank <= 1_000_000
                        or snapshots[index]['status'] != 'available'):
                    raise ValueError('Invalid or duplicate historical observation')
                snapshots[index]['ranks'][domain] = rank
                previous_index = index
    coverage = {r[0]: r[6] for r in rows if len(r) > 6 and r[6]}
    return manifest, rows, snapshots, coverage


def new_dates(snapshots, latest_date):
    """Catch up every missed day; retry only recent unavailable dates, not old gaps."""
    latest = date.fromisoformat(latest_date)
    available = [date.fromisoformat(s['date']) for s in snapshots if s['status'] == 'available']
    last = max(available)
    if latest < last:
        raise ValueError('Upstream latest list is older than the published dataset')
    dates = set()
    day = last + timedelta(days=1)
    while day <= latest:
        dates.add(day)
        day += timedelta(days=1)
    for snapshot in snapshots:
        day = date.fromisoformat(snapshot['date'])
        if snapshot['status'] == 'unavailable' and 0 <= (latest - day).days <= 7:
            dates.add(day)
    return sorted(dates)


def incremental_sync(previous, rows, snapshots, coverage, source_domains, source, domains):
    latest_meta = get_json(f'{TRANCO}/api/lists/date/latest')
    if not latest_meta.get('available'):
        raise ValueError('Latest Tranco list is not ready')
    latest_date = latest_meta['configuration']['endDate']
    requested = new_dates(snapshots, latest_date)
    previous_latest = next(s for s in snapshots if s['date'] == previous['latestDate'])
    if latest_date == previous['latestDate'] and latest_meta['list_id'] != previous_latest['listId']:
        requested.append(date.fromisoformat(latest_date))
    previous_domains = {row[0] for row in rows}
    coverage = {d: start for d, start in coverage.items() if d in domains}
    new_domains = domains - previous_domains
    # New source members are scanned only from the first newly downloaded day onward.
    # Until then, a missing historical rank means not collected, never unranked.
    first_new_day = date.fromisoformat(previous['latestDate']) + timedelta(days=1)
    collect_from = first_new_day.isoformat()
    for domain in new_domains:
        coverage[domain] = collect_from
    source_changed = (source != previous['source'] or domains != previous_domains
                      or previous.get('schemaVersion') != 2)
    if not requested and not source_changed:
        print('Already up to date; no list downloads and no file changes.', flush=True)
        return False
    domain_hash = hashlib.sha256('\n'.join(sorted(domains)).encode()).hexdigest()[:16]
    changed = source_changed
    by_date = {s['date']: s for s in snapshots}
    for day in sorted(set(requested)):
        meta = latest_meta if day.isoformat() == latest_date else None
        snapshot = fetch_snapshot(day, domains, domain_hash, metadata=meta)
        snapshot['ranks'] = {d: r for d, r in snapshot['ranks'].items()
                             if d not in coverage or snapshot['date'] >= coverage[d]}
        old = by_date.get(snapshot['date'])
        if old != snapshot:
            changed = True
        by_date[snapshot['date']] = snapshot
        print(f"Daily {day}: {snapshot['status']}, {len(snapshot['ranks'])} matches", flush=True)
    if changed:
        export_data(domains, source_domains, source, list(by_date.values()), coverage,
                    daily_since=previous.get('dailySince', previous['latestDate']))
    else:
        print('No new observations; published files unchanged.', flush=True)
    return changed


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--workers', type=int, choices=range(1, 5), default=3)
    parser.add_argument('--start', default='2019-01', help='First month for initial import/rebuild, YYYY-MM')
    parser.add_argument('--end', help='Last date for rebuild, YYYY-MM-DD')
    parser.add_argument('--rebuild', action='store_true', help='Explicitly backfill old lists for the current domain set')
    args = parser.parse_args()
    start = date.fromisoformat(args.start + '-01')
    end = date.fromisoformat(args.end) if args.end else datetime.now(timezone.utc).date()
    if start > end or end > datetime.now(timezone.utc).date():
        parser.error('Invalid date interval')
    previous, rows, snapshots, coverage = load_published()
    if previous and not args.rebuild and (args.end or args.start != '2019-01'):
        parser.error('Changing historical coverage requires --rebuild')
    source_domains, source = load_source(previous)
    curated = json.loads((ROOT / 'src/data/domainMetadata.json').read_text())
    domains = source_domains | set(curated)
    print(f"Imported {len(source_domains)} source domains; {len(domains)} including curated entries", flush=True)
    if previous and not args.rebuild:
        incremental_sync(previous, rows, snapshots, coverage, source_domains, source, domains)
        return
    domain_hash = hashlib.sha256('\n'.join(sorted(domains)).encode()).hexdigest()[:16]
    latest = fetch_snapshot('latest', domains, domain_hash) if not args.end else None
    effective_end = min(end, date.fromisoformat(latest['date'])) if latest else end
    # Do not request a month-end later than the latest published list (e.g. early on the 31st).
    # Rebuild preserves previously collected daily dates as well as month-end samples.
    dates = set(month_ends(start, effective_end)) | {date.fromisoformat(s['date']) for s in snapshots
                                          if start <= date.fromisoformat(s['date']) <= effective_end}
    snapshots = []
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(fetch_snapshot, day, domains, domain_hash): day for day in dates}
        for future in as_completed(futures):
            snapshot = future.result()
            snapshots.append(snapshot)
            print(f"{futures[future]}: {snapshot['status']}, {len(snapshot['ranks'])} matching domains", flush=True)
    if latest:
        snapshots.append(latest)
        print(f"Latest {latest['date']}: {len(latest['ranks'])} matching domains", flush=True)
    if not any(s['status'] == 'available' for s in snapshots):
        raise ValueError('No available snapshots; previous dataset retained')
    export_data(domains, source_domains, source, snapshots,
                daily_since=previous.get('dailySince') if previous else None)


if __name__ == '__main__':
    main()

# Iran Tranco

Search the full **Iran Hosted Domains** release and inspect actual historical Tranco ranks. The directory includes every valid explicit hostname in the source release, plus the existing curated project domains. This is **not a registry of every Iranian domain**: `.ir` names, Iranian services hosted abroad, and newly registered domains may be missing from the upstream source.

## Run

```sh
npm ci
npm run dev
```

The committed `public/data` dataset works without Python, a database, credentials, or an API request for each domain. The browser downloads a compact directory, searches and paginates the entire collection, and loads one of 64 history shards only when needed. No synthetic ranking or hosting data is used.

```sh
npm run lint
npm test
npm run build
npm start
```

Vite copies `public/data` into `dist`. Vercel serves the same files and uses `api/tranco.ts` for explicit recent-rank refreshes. `npm run preview` previews the static dataset; live refresh requires `npm run dev`, `npm start`, or the Vercel function.

## Daily GitHub Actions updates

The workflow in `.github/workflows/update-data.yml` runs daily at **02:17 UTC / 05:47 Tehran**, or manually from **Actions → Update Iranian domains and Tranco data → Run workflow**. Put the workflow, scripts and initial `public/data` files on the repository’s default branch to activate the schedule. It uses the built-in `GITHUB_TOKEN` with `contents: write` to commit and push only changes under `public/data`; no external token is required for an ordinary writable branch. GitHub scheduling is best-effort and may run late.

Each run restores existing observations directly from the committed directory and history shards. It checks the source release and latest Tranco metadata, then downloads **only dates after the last collected daily list**, catching up every day missed by a delayed/failed run. The domain release file is downloaded only when its release changes. Recent unavailable dates are retried for seven days; historical unavailable months are not repeatedly fetched. If nothing changed, no data files are rewritten and no commit is created. Validation runs before commit, failures preserve the published manifest, and concurrency prevents overlapping writers. Pushes never use `--force`.

New source domains start collecting ranks with the next newly downloaded list; earlier observations are explicitly marked **not collected**, not unranked. To backfill those domains against older lists, run the workflow manually with `rebuild` enabled. Normal daily runs never trigger that expensive historical download. The daily job requires neither the ignored `.data-cache` directory nor persistent runner storage.

The workflow retains the current and previous immutable dataset generation in the working tree; Git retains older revisions. A deployment based on GitHub Actions `push` events must explicitly chain from this workflow (for example with `workflow_run`), because pushes made by `GITHUB_TOKEN` do not trigger another push workflow. Git-integrated hosting can consume the updated committed dataset through its own deployment integration.

## Refresh the source and historical dataset

Python 3.10+ with its standard library is sufficient:

```sh
npm run data:sync
# Optional bounded historical export (end date is inclusive):
python3 scripts/sync_data.py --rebuild --start 2019-01 --end 2025-12-31 --workers 3
```

On the first run (or with `--rebuild`), the importer reads the latest `domains.txt` release, verifies its published SHA-256, requests month-end Tranco lists from January 2019 through the last completed month, and adds the latest available daily list. January 2019 may be unavailable; unavailable lists remain explicitly marked. Future dates are never generated. A bounded export replaces the published dataset with that interval; run `python3 scripts/sync_data.py --rebuild` without date bounds to restore normal coverage.

Downloads use the ZIP endpoint used by Tranco's official Python client, with CSV fallback for archives without ZIPs. The importer validates all one million sequential CSV rows before accepting a snapshot, extracts **all matching source domains in one pass**, and caches the filtered result in ignored `.data-cache/` files. Metadata requests are paced at no more than one per second; at most three downloads run concurrently by default. Transient failures are retried. Interrupted runs resume from cached completed snapshots. An explicit rebuild keys the download cache by the imported domain set, so new domains receive historical coverage. Normal incremental updates reuse the committed observations instead and never redownload the old lists.

Dataset assets are versioned under `public/data/snapshots/`. The manifest is published after the files are complete, so a failed download leaves the previously published dataset usable. Keep the manifest, referenced snapshot directory, source text and license in version control for deployment. Only the current and previous generation directories are kept in the working tree. Build does not fetch the network or silently replace datasets.

## Rank semantics

- The default Tranco list contains the top **one million** pay-level domains. Source hostnames are matched exactly; a subdomain is not silently assigned its parent domain's rank.
- Historical points are **month-end snapshots**, followed by every newly published daily list and any explicitly refreshed recent daily ranks. They are not calendar-month averages. Tranco itself aggregates underlying rankings over a rolling 30-day window.
- `null` rank in an available list means **outside the downloaded top one million**. An unavailable list means **unknown**. Both produce chart gaps, but have distinct labels in the history table.
- Filters use calendar dates. Comparison charts align by actual date and proportionally space time on the horizontal axis.
- Annual changes compare the current rank with a snapshot at or up to 31 days before the calendar anniversary. If either observation is absent, the change remains `null`. The directory shows the reference date.
- Best rank means **best observed in the downloaded samples**, not an all-time daily peak.
- Refresh merges recent data into historical points and retains list IDs. Browser cache reset preserves the distributed archive. Old v1 synthetic caches are ignored.
- Sector labels and display names are curated in `src/data/domainMetadata.json`. All other domains are uncategorized. The domain source does not supply current IP, ASN, CDN or hosting details; none are invented.

## Data files and provenance

`public/data/manifest.json` records source URL, release, publication/download timestamps, checksum, actual counts and dated Tranco list IDs. Each history-table list ID links to its original Tranco archive.

The compact directory rows are `[domain, currentRank, annualChange, bestObservedRank, bestObservedDate, inSourceRelease, historyCollectionStart]`. `historyCollectionStart` is an optional seventh directory field: earlier dates have not been collected for newly added domains. History shards map domains to `[snapshotIndex, rank]` pairs; missing pairs are interpreted using that snapshot's availability in the manifest. Shards are selected by the sum of domain ASCII character codes modulo 64 (two-digit hexadecimal).

Sources:

- [bootmortis/iran-hosted-domains](https://github.com/bootmortis/iran-hosted-domains), MIT; license copied to `public/data/IRAN-HOSTED-DOMAINS-LICENSE.txt`.
- [Tranco API documentation](https://tranco-list.eu/api_documentation).
- [Official Tranco Python client](https://github.com/DistriNet/tranco-python-package), used as reference for the archived ZIP endpoint.
- [Tranco methodology and source attribution](https://tranco-list.eu/methodology). Providers and methodology have changed over time; longitudinal ranks should be interpreted accordingly.

- [GitHub schedule events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).
- [Triggering a workflow with GITHUB_TOKEN](https://docs.github.com/en/actions/how-tos/writing-workflows/choosing-when-your-workflow-runs/triggering-a-workflow).

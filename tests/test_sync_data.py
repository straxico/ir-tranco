import importlib.util
import json
import tempfile
import unittest
from datetime import date
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('sync_data', Path(__file__).parents[1] / 'scripts/sync_data.py')
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)


class SyncTests(unittest.TestCase):
    def test_normalizes_explicit_domains_without_inventing_wildcards(self):
        self.assertEqual(sync.normalize_domain(' Example.IR. '), 'example.ir')
        self.assertTrue(sync.normalize_domain('مثال.ir').startswith('xn--'))
        for value in ['ir', '*.ir', '127.0.0.1', 'http://example.ir', 'bad host.ir', '-bad.ir', 'bad-.ir']:
            self.assertIsNone(sync.normalize_domain(value), value)

    def test_month_ends_include_leap_day_and_exclude_partial_month(self):
        self.assertEqual(list(sync.month_ends(date(2024, 1, 1), date(2024, 3, 15))),
                         [date(2024, 1, 31), date(2024, 2, 29)])

    def test_truncated_or_out_of_order_downloads_are_rejected(self):
        with self.assertRaises(ValueError):
            sync.extract_ranks(['1,example.ir', '2,other.com'], {'example.ir'})
        with self.assertRaises(ValueError):
            sync.extract_ranks(['2,example.ir'], {'example.ir'})

    def test_annual_comparison_requires_a_nearby_snapshot(self):
        snapshots = [{'date': '2020-01-31', 'status': 'available'}]
        self.assertIsNone(sync.prior_snapshot(snapshots, date(2026, 9, 24), 12))
        snapshots += [{'date': '2025-08-31', 'status': 'available'},
                      {'date': '2025-09-30', 'status': 'available'}]
        self.assertEqual(sync.prior_snapshot(snapshots, date(2026, 9, 24), 12)['date'], '2025-08-31')

    def test_missing_anniversary_list_is_not_replaced_with_an_older_rank(self):
        snapshots = [{'date': '2025-08-31', 'status': 'available'},
                     {'date': '2025-09-30', 'status': 'unavailable'}]
        self.assertIsNone(sync.prior_snapshot(snapshots, date(2026, 9, 30), 12))

    def test_export_keeps_all_domains_and_distinguishes_missing_lists(self):
        snapshots = [
            {'date': '2025-01-31', 'status': 'unavailable', 'ranks': {}},
            {'date': '2025-08-31', 'status': 'available', 'listId': 'OLD', 'ranks': {'a.ir': 100}},
            {'date': '2026-09-24', 'status': 'available', 'listId': 'NEW', 'ranks': {'b.ir': 50}},
        ]
        with tempfile.TemporaryDirectory() as folder, patch.object(sync, 'OUTPUT', Path(folder)):
            sync.export_data({'a.ir', 'b.ir', 'c.ir'}, {'a.ir', 'b.ir'}, {'sha256': 'test'}, snapshots)
            manifest = json.loads((Path(folder) / 'manifest.json').read_text())
            asset = Path(folder) / manifest['assetsPrefix']
            rows = json.loads((asset / 'directory.json').read_text())
            self.assertEqual(len(rows), 3)
            self.assertIsNone(rows[0][1])  # Historical rank must not become current rank.
            self.assertIsNone(rows[0][2])  # Missing current rank is not a zero change.
            self.assertEqual(rows[0][3], 100)
            self.assertFalse(rows[2][5])  # Curated entry is not verified source membership.
            self.assertEqual(manifest['snapshots'][0]['status'], 'unavailable')
            self.assertEqual(manifest['rankedDomains'], 1)
            history = json.loads((asset / 'history' / f'{sync.bucket("a.ir")}.json').read_text())
            self.assertEqual(history['a.ir'], [[1, 100]])
            self.assertEqual((Path(folder) / 'iran-hosted-domains.txt').read_text(), 'a.ir\nb.ir\n')


class IncrementalTests(unittest.TestCase):
    def setUp(self):
        self.source = {'release': 'test', 'sha256': 'test'}
        self.previous = {'schemaVersion': 2, 'source': self.source, 'latestDate': '2026-09-24', 'dailySince': '2026-09-24'}
        self.snapshots = [
            {'date': '2019-01-31', 'status': 'unavailable', 'ranks': {}},
            {'date': '2019-02-28', 'status': 'available', 'listId': 'OLD', 'ranks': {'a.ir': 100}},
            {'date': '2026-09-24', 'status': 'available', 'listId': 'CURRENT', 'ranks': {'a.ir': 50}},
        ]
        self.rows = [['a.ir', 50, None, 50, '2026-09-24', True, None]]
        self.meta = {'available': True, 'list_id': 'CURRENT', 'configuration': {'endDate': '2026-09-24'}}

    def test_unchanged_day_does_not_download_or_rewrite(self):
        with patch.object(sync, 'get_json', return_value=self.meta), \
                patch.object(sync, 'fetch_snapshot') as download, patch.object(sync, 'export_data') as export:
            changed = sync.incremental_sync(self.previous, self.rows, self.snapshots, {}, {'a.ir'}, self.source, {'a.ir'})
        self.assertFalse(changed)
        download.assert_not_called()
        export.assert_not_called()

    def test_missed_runs_request_only_new_days_and_recent_gaps(self):
        snapshots = self.snapshots + [{'date': '2026-09-25', 'status': 'unavailable', 'ranks': {}}]
        self.assertEqual(sync.new_dates(snapshots, '2026-09-27'),
                         [date(2026, 9, 25), date(2026, 9, 26), date(2026, 9, 27)])
        self.assertNotIn(date(2019, 1, 31), sync.new_dates(snapshots, '2026-09-27'))

    def test_added_source_domain_never_restarts_old_downloads(self):
        with patch.object(sync, 'get_json', return_value=self.meta), \
                patch.object(sync, 'fetch_snapshot') as download, patch.object(sync, 'export_data') as export:
            changed = sync.incremental_sync(self.previous, self.rows, self.snapshots, {}, {'a.ir', 'new.ir'},
                                           {**self.source, 'release': 'new'}, {'a.ir', 'new.ir'})
        self.assertTrue(changed)
        download.assert_not_called()
        self.assertEqual(export.call_args.args[4], {'new.ir': '2026-09-25'})
        self.assertEqual(export.call_args.args[3], self.snapshots)

    def test_catchup_preserves_old_ranks_and_fetches_exactly_missing_dates(self):
        meta = {**self.meta, 'list_id': 'NEW', 'configuration': {'endDate': '2026-09-26'}}
        def downloaded(day, *_args, **_kwargs):
            return {'date': day.isoformat(), 'status': 'available', 'listId': 'D' + str(day.day), 'ranks': {'a.ir': 40}}
        with patch.object(sync, 'get_json', return_value=meta), \
                patch.object(sync, 'fetch_snapshot', side_effect=downloaded) as download, \
                patch.object(sync, 'export_data') as export:
            sync.incremental_sync(self.previous, self.rows, self.snapshots, {}, {'a.ir'}, self.source, {'a.ir'})
        self.assertEqual([call.args[0] for call in download.call_args_list], [date(2026, 9, 25), date(2026, 9, 26)])
        self.assertEqual(export.call_args.args[3][:3], self.snapshots)

    def test_retrying_an_old_gap_does_not_fabricate_coverage_for_new_domains(self):
        snapshots = self.snapshots + [{'date': '2026-09-23', 'status': 'unavailable', 'ranks': {}}]
        retried = {'date': '2026-09-23', 'status': 'available', 'listId': 'FIXED', 'ranks': {'a.ir': 60, 'new.ir': 80}}
        with patch.object(sync, 'get_json', return_value=self.meta), \
                patch.object(sync, 'fetch_snapshot', return_value=retried), patch.object(sync, 'export_data') as export:
            sync.incremental_sync(self.previous, self.rows, snapshots, {}, {'a.ir', 'new.ir'},
                                  {**self.source, 'release': 'new'}, {'a.ir', 'new.ir'})
        self.assertEqual(export.call_args.args[4]['new.ir'], '2026-09-25')
        old_gap = next(s for s in export.call_args.args[3] if s['date'] == '2026-09-23')
        self.assertNotIn('new.ir', old_gap['ranks'])

    def test_failed_new_download_does_not_publish_partial_results(self):
        meta = {**self.meta, 'list_id': 'NEW', 'configuration': {'endDate': '2026-09-26'}}
        with patch.object(sync, 'get_json', return_value=meta), \
                patch.object(sync, 'fetch_snapshot', side_effect=TimeoutError), patch.object(sync, 'export_data') as export:
            with self.assertRaises(TimeoutError):
                sync.incremental_sync(self.previous, self.rows, self.snapshots, {}, {'a.ir'}, self.source, {'a.ir'})
        export.assert_not_called()

    def test_git_files_restore_history_without_a_runner_cache(self):
        with tempfile.TemporaryDirectory() as folder, patch.object(sync, 'OUTPUT', Path(folder)):
            sync.export_data({'a.ir'}, {'a.ir'}, self.source, self.snapshots, {'a.ir': '2019-02-28'})
            manifest, rows, restored, coverage = sync.load_published()
            self.assertEqual(manifest['schemaVersion'], 2)
            self.assertEqual(restored, self.snapshots)
            self.assertEqual(coverage, {'a.ir': '2019-02-28'})
            self.assertEqual(rows[0][6], '2019-02-28')


if __name__ == '__main__':
    unittest.main()

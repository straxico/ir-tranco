import { test } from "node:test";
import assert from "node:assert/strict";
import {
  monthsBefore,
  rangeDates,
  changeAt,
  mergeHistory,
} from "../src/utils/ranks.ts";

test("calendar ranges clamp leap days and month ends", () => {
  assert.equal(monthsBefore("2024-02-29", 12), "2023-02-28");
  assert.equal(monthsBefore("2026-03-31", 1), "2026-02-28");
});
test("ranges use dates and the union of unequal series, not row counts", () => {
  const first = [
    { date: "2020-01-31", rank: 1 },
    { date: "2026-09-20", rank: 2 },
  ];
  const second = [
    { date: "2026-03-31", rank: 3 },
    { date: "2026-09-24", rank: null },
  ];
  assert.deepEqual(rangeDates([first, second], "6m"), [
    "2026-03-31",
    "2026-09-20",
    "2026-09-24",
  ]);
  assert.equal(rangeDates([first, second], "all").length, 4);
});
test("annual change does not substitute a last-known rank for a missing observation", () => {
  assert.equal(
    changeAt(
      [
        { date: "2025-08-31", rank: 100 },
        { date: "2026-09-24", rank: 75 },
      ],
      12,
    ),
    25,
  );
  assert.equal(
    changeAt(
      [
        { date: "2025-08-31", rank: null },
        { date: "2026-09-24", rank: 75 },
      ],
      12,
    ),
    null,
  );
  assert.equal(
    changeAt(
      [
        { date: "2020-08-31", rank: 100 },
        { date: "2026-09-24", rank: 75 },
      ],
      12,
    ),
    null,
  );
  assert.equal(
    changeAt(
      [
        { date: "2025-08-31", rank: 100 },
        { date: "2026-09-24", rank: null },
      ],
      12,
    ),
    null,
  );
});
test("refresh retains archive, sorts dates, deduplicates and preserves list provenance", () => {
  const merged = mergeHistory(
    [
      { date: "2019-02-28", rank: 100, listId: "OLD" },
      { date: "2026-08-31", rank: 90, listId: "NEW" },
    ],
    [
      { date: "2026-09-24", rank: 80 },
      { date: "2026-08-31", rank: 90 },
    ],
  );
  assert.deepEqual(
    merged.map((p) => p.date),
    ["2019-02-28", "2026-08-31", "2026-09-24"],
  );
  assert.equal(merged[1].listId, "NEW");
});

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { DomainItem } from "../types/domain";
import { fetchDomains, fetchDomainDetail } from "../services/api";
import { formatChange, formatRank } from "../utils/ranks";
import { RankChart } from "./RankChart";
const PRESETS = [
  {
    fa: "اجاره ویلا",
    en: "Villa rentals",
    domains: ["jabama.com", "jajiga.com", "shab.ir", "otaghak.com"],
  },
  {
    fa: "پرواز و هتل",
    en: "Flights & hotels",
    domains: ["alibaba.ir", "flytoday.ir", "snapptrip.com", "safarmarket.com"],
  },
  {
    fa: "طلا و سکه",
    en: "Gold",
    domains: ["tgju.org", "tala.ir", "melligold.com", "goldika.ir"],
  },
  {
    fa: "ارز دیجیتال",
    en: "Crypto",
    domains: ["nobitex.ir", "wallex.ir", "bitpin.ir", "abantether.com"],
  },
  {
    fa: "فروشگاه‌ها",
    en: "Shopping",
    domains: ["digikala.com", "torob.com", "basalam.com", "technolife.ir"],
  },
  { fa: "تاکسی آنلاین", en: "Ride hailing", domains: ["snapp.ir", "tapsi.ir"] },
];
interface Props {
  isOpen: boolean;
  onClose: () => void;
  comparedDomains: DomainItem[];
  onRemoveDomain: (d: DomainItem) => void;
  onAddDomain: (d: DomainItem) => void | Promise<void>;
  onSelectDomain: (d: DomainItem) => void;
  isPersian: boolean;
}
export const ComparisonModal: React.FC<Props> = ({
  isOpen,
  onClose,
  comparedDomains,
  onRemoveDomain,
  onAddDomain,
  onSelectDomain,
  isPersian,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DomainItem[]>([]);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let cancelled = false;
    if (!isOpen || !query.trim()) {
      setResults([]);
      return;
    }
    setResults([]);
    setError(false);
    const timer = setTimeout(() => {
      fetchDomains("all", query, "rank_asc", 0, 8)
        .then((r) => {
          if (!cancelled) setResults(r.items);
        })
        .catch(() => {
          if (!cancelled) setError(true);
        });
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isOpen, query]);
  if (!isOpen) return null;
  const add = async (domain: string) => {
    setBusy(true);
    setError(false);
    try {
      const value = await fetchDomainDetail(domain);
      if (value) await onAddDomain(value);
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };
  const applyPreset = async (names: string[]) => {
    setBusy(true);
    setError(false);
    try {
      const entries = await Promise.all(names.map(fetchDomainDetail));
      if (entries.some((d) => !d)) throw new Error("Preset domain unavailable");
      comparedDomains.forEach(onRemoveDomain);
      for (const entry of entries) await onAddDomain(entry!);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isPersian ? "مقایسه دامنه‌ها" : "Compare domains"}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur p-4 flex items-center justify-center"
    >
      <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-5xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">
            {isPersian ? "مقایسه تاریخچه دامنه‌ها" : "Compare domain histories"}{" "}
            ({comparedDomains.length}/5)
          </h2>
          <button onClick={onClose} aria-label={isPersian ? "بستن" : "Close"}>
            <X />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.en}
              disabled={busy}
              onClick={() => applyPreset(p.domains)}
              className="text-xs rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-slate-300 disabled:opacity-40"
            >
              {isPersian ? p.fa : p.en}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {comparedDomains.map((d) => (
            <button
              className="rounded-lg bg-slate-800 text-cyan-300 px-3 py-2 text-xs"
              key={d.domain}
              onClick={() => onRemoveDomain(d)}
            >
              {d.domain} ×
            </button>
          ))}
        </div>
        {comparedDomains.length < 5 && (
          <div className="space-y-2">
            <input
              aria-label={
                isPersian ? "افزودن دامنه به مقایسه" : "Add comparison domain"
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                isPersian
                  ? "جستجو در کل فهرست دامنه‌ها..."
                  : "Search the entire directory..."
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs"
            />
            {results
              .filter(
                (d) => !comparedDomains.some((c) => c.domain === d.domain),
              )
              .map((d) => (
                <button
                  key={d.domain}
                  disabled={busy}
                  onClick={async () => {
                    await add(d.domain);
                    setQuery("");
                  }}
                  className="block text-xs text-cyan-400 p-2 disabled:opacity-40"
                >
                  + {d.domain} · {formatRank(d.currentRank)}
                </button>
              ))}
          </div>
        )}
        {busy && (
          <p role="status" className="text-xs text-cyan-400">
            {isPersian ? "در حال دریافت تاریخچه..." : "Loading history..."}
          </p>
        )}
        {error && (
          <p role="alert" className="text-xs text-rose-400">
            {isPersian
              ? "دریافت داده انجام نشد؛ دوباره تلاش کنید."
              : "Could not load data; please retry."}
          </p>
        )}
        {comparedDomains.length ? (
          <>
            <RankChart domains={comparedDomains} isPersian={isPersian} />
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead>
                  <tr>
                    {(isPersian
                      ? [
                          "دامنه",
                          "آخرین رتبه",
                          "تاریخ",
                          "تغییر یک‌ساله",
                          "بهترین مشاهده",
                        ]
                      : [
                          "Domain",
                          "Latest rank",
                          "Date",
                          "1Y change",
                          "Best observation",
                        ]
                    ).map((t) => (
                      <th className="text-start p-3" key={t}>
                        {t}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparedDomains.map((d) => (
                    <tr key={d.domain} className="border-t border-slate-800">
                      <td className="p-3">
                        <button
                          className="text-cyan-400"
                          onClick={() => onSelectDomain(d)}
                        >
                          {d.domain}
                        </button>
                      </td>
                      <td className="p-3" dir="ltr">
                        {formatRank(d.currentRank)}
                      </td>
                      <td className="p-3">{d.rankDate}</td>
                      <td className="p-3" dir="ltr">
                        {formatChange(d.rank1yChange)}
                      </td>
                      <td className="p-3" dir="ltr">
                        {formatRank(d.peakRank)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-slate-400 text-sm py-8 text-center">
            {isPersian
              ? "تا پنج دامنه برای مقایسه انتخاب کنید."
              : "Choose up to five domains to compare."}
          </p>
        )}
      </div>
    </div>
  );
};

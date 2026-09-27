import React, { useState } from "react";
import { X, RefreshCw } from "lucide-react";
import { DomainItem } from "../types/domain";
import { refreshDomainCache } from "../services/api";
import { formatChange, formatRank } from "../utils/ranks";
import { RankChart } from "./RankChart";
interface Props {
  domain: DomainItem | null;
  onClose: () => void;
  isPersian: boolean;
  onDomainUpdated: (d: DomainItem) => void;
}
export const DomainDetailModal: React.FC<Props> = ({
  domain,
  onClose,
  isPersian,
  onDomainUpdated,
}) => {
  const [tab, setTab] = useState<"chart" | "table">("chart");
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  if (!domain) return null;
  const refresh = async () => {
    setRefreshing(true);
    setError("");
    try {
      onDomainUpdated(await refreshDomainCache(domain.domain));
    } catch (e) {
      setError(
        isPersian
          ? "به‌روزرسانی ترنکو انجام نشد؛ کمی بعد دوباره تلاش کنید. تاریخچه آرشیوی حفظ شده است."
          : String(e),
      );
    } finally {
      setRefreshing(false);
    }
  };
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={domain.domain}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur"
    >
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-7 space-y-5">
        <div className="flex justify-between items-center gap-3">
          <div>
            <h2 className="font-bold text-xl">
              {isPersian ? domain.titleFa : domain.titleEn}
            </h2>
            <a
              href={`https://${domain.domain}`}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 text-sm font-mono"
            >
              {domain.domain}
            </a>
          </div>
          <div className="flex items-center gap-4">
            <button
              disabled={refreshing}
              onClick={refresh}
              aria-label={
                isPersian ? "دریافت رتبه‌های جدید" : "Refresh recent ranks"
              }
              className="text-cyan-400 disabled:opacity-40"
            >
              <RefreshCw
                size={18}
                className={refreshing ? "animate-spin" : ""}
              />
            </button>
            <button onClick={onClose} aria-label={isPersian ? "بستن" : "Close"}>
              <X />
            </button>
          </div>
        </div>
        {error && (
          <p role="alert" className="text-sm text-rose-400">
            {error}
          </p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {[
            [
              isPersian ? "رتبه آخرین مشاهده" : "Latest rank",
              formatRank(domain.currentRank),
              domain.rankDate,
            ],
            [
              isPersian ? "بهترین رتبه مشاهده‌شده" : "Best observed rank",
              formatRank(domain.peakRank),
              domain.peakDate,
            ],
            [
              isPersian ? "تغییر یک‌ساله" : "1Y change",
              formatChange(domain.rank1yChange),
              isPersian
                ? "در صورت وجود داده قابل مقایسه"
                : "When comparable data exists",
            ],
            [
              isPersian ? "منبع دامنه" : "Domain source",
              domain.hosting.bootmortisVerified
                ? "Iran Hosted Domains"
                : isPersian
                  ? "فهرست پروژه / استعلام"
                  : "Curated / lookup",
              domain.categoryFa,
            ],
          ].map(([title, value, note]) => (
            <div
              key={title}
              className="bg-slate-950/60 rounded-xl p-3 space-y-2"
            >
              <p className="text-slate-400">{title}</p>
              <strong className="block text-cyan-300" dir="auto">
                {value}
              </strong>
              <p className="text-slate-500">{note}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-sm">
            {isPersian ? "تاریخچه واقعی رتبه ترنکو" : "Archived Tranco history"}
          </h3>
          <div className="flex gap-2 text-xs">
            <button
              className={tab === "chart" ? "text-cyan-400" : "text-slate-400"}
              onClick={() => setTab("chart")}
            >
              {isPersian ? "نمودار" : "Chart"}
            </button>
            <button
              className={tab === "table" ? "text-cyan-400" : "text-slate-400"}
              onClick={() => setTab("table")}
            >
              {isPersian ? "جدول و منابع" : "Table & sources"}
            </button>
          </div>
        </div>
        {tab === "chart" ? (
          <RankChart domains={[domain]} isPersian={isPersian} />
        ) : (
          <div className="max-h-96 overflow-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr>
                  {(isPersian
                    ? ["تاریخ", "فهرست ترنکو", "رتبه / وضعیت"]
                    : ["Date", "Tranco list", "Rank / status"]
                  ).map((t) => (
                    <th key={t} className="p-2 text-start">
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...domain.history].reverse().map((p) => (
                  <tr key={p.date} className="border-t border-slate-800">
                    <td className="p-2 font-mono">{p.date}</td>
                    <td className="p-2">
                      {p.listId ? (
                        <a
                          className="text-cyan-400"
                          href={`https://tranco-list.eu/list/${p.listId}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {p.listId}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-2">
                      {p.rank != null
                        ? formatRank(p.rank)
                        : p.status === "not_collected"
                          ? (isPersian ? "تاریخچه این دامنه دریافت نشده" : "History not collected for this domain")
                          : p.status === "unavailable"
                          ? isPersian
                            ? "فهرست این تاریخ موجود نیست"
                            : "List unavailable"
                          : isPersian
                            ? "خارج از یک میلیون دامنه برتر"
                            : "Outside top one million"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-slate-400 leading-6">
          {isPersian
            ? "عضویت در فهرست عمومی به معنی تأیید فعلی IP یا میزبان نیست. اطلاعات میزبانی در این منبع ارائه نشده است. رتبه‌های خالی تخمین زده نمی‌شوند."
            : "Source membership does not verify current IP or hosting. Hosting details are not supplied by this source. Missing ranks are not estimated."}
        </p>
      </div>
    </div>
  );
};

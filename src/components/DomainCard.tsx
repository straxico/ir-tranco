import React from "react";
import { DomainItem } from "../types/domain";
import { formatChange, formatRank } from "../utils/ranks";
interface Props {
  domain: DomainItem;
  onSelect: (d: DomainItem) => void;
  isCompared: boolean;
  onToggleCompare: (d: DomainItem) => void;
  isPersian: boolean;
}
export const DomainCard: React.FC<Props> = ({
  domain: d,
  onSelect,
  isCompared,
  onToggleCompare,
  isPersian,
}) => (
  <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-4">
    <div className="flex justify-between items-start gap-2">
      <button onClick={() => onSelect(d)} className="text-start">
        <h3 className="font-bold text-white hover:text-cyan-400">
          {isPersian ? d.titleFa : d.titleEn}
        </h3>
        <span className="text-xs font-mono text-cyan-400" dir="ltr">
          {d.domain}
        </span>
      </button>
      <button
        onClick={() => onToggleCompare(d)}
        className="text-xs text-cyan-300 rounded bg-slate-800 px-2 py-1"
      >
        {isCompared
          ? isPersian
            ? "حذف از مقایسه"
            : "Remove"
          : isPersian
            ? "+ مقایسه"
            : "+ Compare"}
      </button>
    </div>
    <p className="text-xs text-slate-400">{d.categoryFa}</p>
    <div className="flex justify-between border-t border-slate-800 pt-3 gap-2">
      <div>
        <p className="text-xs text-slate-400">
          {isPersian ? "رتبه ترنکو" : "Tranco rank"}
        </p>
        <strong className="text-xl font-mono" dir="ltr">
          {formatRank(d.currentRank)}
        </strong>
        <p className="text-[10px] text-slate-500">
          {d.currentRank == null
            ? d.rankStatus === "not_collected" ? (isPersian ? "رتبه هنوز دریافت نشده" : "Rank not yet collected") : isPersian
              ? "خارج از یک میلیون دامنه برتر"
              : "Outside top one million"
            : d.rankDate}
        </p>
      </div>
      <div className="text-end">
        <p className="text-xs text-slate-400">
          {isPersian ? "تغییر یک‌ساله" : "1Y change"}
        </p>
        <span
          dir="ltr"
          className={
            d.rank1yChange == null
              ? "text-slate-500"
              : d.rank1yChange >= 0
                ? "text-emerald-400"
                : "text-rose-400"
          }
        >
          {formatChange(d.rank1yChange)}
        </span>
      </div>
    </div>
    <button onClick={() => onSelect(d)} className="text-xs text-cyan-400">
      {isPersian ? "تاریخچه و جزئیات ←" : "History & details →"}
    </button>
  </div>
);

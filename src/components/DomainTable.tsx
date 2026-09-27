import React from "react";
import { DomainItem, SortOption } from "../types/domain";
import { formatChange, formatRank } from "../utils/ranks";
interface Props {
  domains: DomainItem[];
  onSelect: (d: DomainItem) => void;
  comparedDomains: DomainItem[];
  onToggleCompare: (d: DomainItem) => void;
  isPersian: boolean;
  currentSort: SortOption;
  onSortChange: (s: SortOption) => void;
}
export const DomainTable: React.FC<Props> = ({
  domains,
  onSelect,
  comparedDomains,
  onToggleCompare,
  isPersian,
}) => (
  <div className="overflow-x-auto rounded-xl border border-slate-800">
    <table className="w-full text-start text-xs">
      <thead className="bg-slate-900 text-slate-400">
        <tr>
          {(isPersian
            ? [
                "دامنه",
                "دسته‌بندی",
                "رتبه ترنکو",
                "تغییر یک‌ساله",
                "بهترین رتبه مشاهده‌شده",
                "مقایسه",
              ]
            : [
                "Domain",
                "Category",
                "Tranco rank",
                "1Y change",
                "Best observed rank",
                "Compare",
              ]
          ).map((t) => (
            <th key={t} className="p-3 text-start">
              {t}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {domains.map((d) => (
          <tr
            key={d.domain}
            className="border-t border-slate-800 hover:bg-slate-900/70"
          >
            <td className="p-3">
              <button className="text-start" onClick={() => onSelect(d)}>
                <strong className="block text-white">
                  {isPersian ? d.titleFa : d.titleEn}
                </strong>
                <span className="text-cyan-400 font-mono">{d.domain}</span>
              </button>
            </td>
            <td className="p-3 text-slate-400">{d.categoryFa}</td>
            <td className="p-3 font-mono" dir="ltr">
              {formatRank(d.currentRank)}
            </td>
            <td className="p-3 font-mono" dir="ltr">
              {formatChange(d.rank1yChange)}
            </td>
            <td className="p-3 font-mono" dir="ltr">
              {formatRank(d.peakRank)}
            </td>
            <td className="p-3">
              <button
                onClick={() => onToggleCompare(d)}
                className="text-cyan-400"
              >
                {comparedDomains.some((c) => c.domain === d.domain) ? "−" : "+"}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

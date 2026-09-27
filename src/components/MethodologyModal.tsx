import React from "react";
import { X } from "lucide-react";
interface Props {
  isOpen: boolean;
  onClose: () => void;
  isPersian: boolean;
}
export const MethodologyModal: React.FC<Props> = ({
  isOpen,
  onClose,
  isPersian,
}) =>
  !isOpen ? null : (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isPersian ? "روش‌شناسی" : "Methodology"}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur"
    >
      <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 p-6 space-y-5">
        <div className="flex justify-between">
          <h2 className="font-bold">
            {isPersian
              ? "منابع و محدوده پوشش داده‌ها"
              : "Sources & data coverage"}
          </h2>
          <button onClick={onClose} aria-label={isPersian ? "بستن" : "Close"}>
            <X />
          </button>
        </div>
        <div className="text-sm text-slate-300 leading-7 space-y-4">
          <p>
            {isPersian
              ? "فهرست دامنه‌ها شامل تمام نام‌های صریح و معتبر موجود در فایل domains.txt انتشار Iran Hosted Domains است. دامنه‌های منتخب قبلی پروژه نیز حفظ شده‌اند. این منبع، فهرست ثبت رسمی همه دامنه‌های ایرانی نیست و عضویت در آن تأیید فعلی IP، CDN یا میزبان محسوب نمی‌شود. دامنه‌های بدون برچسب معتبر، دسته‌بندی‌نشده هستند."
              : "The directory includes every valid explicit hostname in the Iran Hosted Domains domains.txt release, plus previous curated project entries. It is not a registry of every Iranian domain and does not verify current IP, CDN or hosting. Domains without curated labels remain uncategorized."}
          </p>
          <a
            className="block text-cyan-400 underline"
            href="https://github.com/bootmortis/iran-hosted-domains"
            target="_blank"
            rel="noreferrer"
          >
            Iran Hosted Domains · MIT
          </a>
          <p>
            {isPersian
              ? "تاریخچه با استخراج رتبه دامنه از فهرست یک میلیون دامنه برتر ترنکو در آخر هر ماه ساخته می‌شود. پس از ساخت آرشیو اولیه، هر روز فقط فهرست‌های جدید دریافت و به تاریخچه افزوده می‌شوند. هر نقطه، رتبه آن تاریخ است؛ میانگین ماه تقویمی نیست. خود رتبه‌بندی ترنکو منابع چندگانه را در پنجره متحرک ۳۰ روزه تجمیع می‌کند و ترکیب منابع آن در طول زمان تغییر کرده است."
              : "History extracts each domain’s rank from Tranco’s top-one-million list at month end, then appends newly published daily lists. Each point is a dated rank, not a calendar-month average. Tranco itself aggregates multiple providers over a rolling 30-day window; its providers have changed over time."}
          </p>
          <p>
            {isPersian
              ? "دامنه‌های تازه‌افزوده‌شده از زمان ورود به فهرست رصد می‌شوند؛ تاریخچه قبل از آن «دریافت‌نشده» است. اگر فایل تاریخ موردنظر در آرشیو موجود نباشد، وضعیت «فهرست ناموجود» ثبت می‌شود. اگر فایل موجود باشد اما دامنه در آن نباشد، وضعیت «خارج از یک میلیون دامنه برتر» نمایش داده می‌شود. هیچ رتبه‌ای تولید یا تخمین زده نمی‌شود. بهترین رتبه فقط در میان نمونه‌های دریافت‌شده محاسبه می‌شود، نه همه روزهای تاریخ."
              : "New source members are tracked from their first collection date; earlier history is marked not collected. An unavailable dated list is distinct from a domain absent from an available list. No ranks are generated or estimated. Best observed rank is limited to downloaded samples, not every historical day."}
          </p>
          <p>
            {isPersian
              ? "فیلترهای نمودار بر اساس تاریخ تقویمی عمل می‌کنند. تغییر یک‌ساله نسبت به آخرین نمونه در تاریخ هدف یا حداکثر ۳۱ روز پیش از آن محاسبه می‌شود؛ بدون رتبه معتبر در هر دو سمت، مقدار خالی است. تازه‌سازی، داده روزهای اخیر را با آرشیو ادغام می‌کند و تاریخچه قدیمی را حذف نمی‌کند."
              : "Chart ranges use calendar dates. Annual change uses the last sample at or up to 31 days before the target date; both ranks must exist. Refresh merges recent daily observations into the archive without removing older history."}
          </p>
          <a
            className="block text-cyan-400 underline"
            href="https://tranco-list.eu/api_documentation"
            target="_blank"
            rel="noreferrer"
          >
            Tranco API documentation
          </a>
          <a
            className="block text-cyan-400 underline"
            href="/data/manifest.json"
            target="_blank"
            rel="noreferrer"
          >
            {isPersian
              ? "جزئیات انتشار، تاریخ‌ها و شناسه فهرست‌ها"
              : "Release provenance, dates & list IDs"}
          </a>
        </div>
      </div>
    </div>
  );

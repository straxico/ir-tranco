import React from 'react';
import { X, BookOpen, ExternalLink, ShieldCheck, Database, Award, Info } from 'lucide-react';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPersian: boolean;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({
  isOpen,
  onClose,
  isPersian,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-6 my-auto max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isPersian ? 'روش‌شناسی داده‌ها و مراجع پژوهشی' : 'Data Methodology & Research Sources'}
              </h3>
              <p className="text-xs text-slate-400">
                {isPersian
                  ? 'بررسی مستندات رتبه‌بندی Tranco List و پروژه iran-hosted-domains'
                  : 'Tranco List & Iran-Hosted-Domains research foundations'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: Tranco */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
              <Award className="w-4 h-4" />
              <span>{isPersian ? '۱. رتبه‌بندی علمی ترنکو (Tranco List)' : '1. Tranco List Research Standard'}</span>
            </div>
            <a
              href="https://tranco-list.eu/"
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <span>tranco-list.eu</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {isPersian
              ? 'پروژه Tranco یک فهرست پژوهشی و استاندارد آکادمیک از محبوب‌ترین وب‌سایت‌های جهان است که در سال ۲۰۱۹ توسط پژوهشگران امنیت وب و دانشگاه‌های اروپایی طراحی شد. بر خلاف الکسا (Alexa) که دستخوش دستکاری و خطا بود، ترنکو از تجمیع ۴ منبع معتبر (Cisco Umbrella، Majestic Million، Cloudflare Radar و Chrome UX Report) با قانون داودال (Dowdall Rule) در یک پنجره متحرک ۳۰ روزه برای تعیین رتبه بدون خطا استفاده می‌کند.'
              : 'The Tranco list is a research-oriented top sites ranking introduced in 2019 by security researchers. Unlike Alexa, it aggregates multiple providers (Cisco Umbrella, Majestic, Cloudflare Radar, Chrome UX Report) over a 30-day window using the Dowdall Borda rule to ensure resistance to manipulation.'}
          </p>
        </div>

        {/* Section 2: iran-hosted-domains */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>{isPersian ? '۲. پروژه دامنه‌های میزبانی ایران (iran-hosted-domains)' : '2. Bootmortis Iran-Hosted-Domains'}</span>
            </div>
            <a
              href="https://github.com/bootmortis/iran-hosted-domains"
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-400 transition-colors"
            >
              <span>github.com/bootmortis</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {isPersian
              ? 'مخزن متن‌باز bootmortis/iran-hosted-domains یکی از دقیق‌ترین پایگاه‌های داده جامعه متن‌باز برای رصد و مستندسازی دامنه‌ها، پورتال‌ها و سرورهایی است که ترافیک آن‌ها در مراکز داده داخلی ایران (آسیاتک، ابر آروان، دژاک، افرانت، مبین‌نت، شاتل و همراه اول) نگهداری و پردازش می‌شود.'
              : 'The open-source bootmortis/iran-hosted-domains repository curates and validates domains operating within Iranian data centers and ASNs (ArvanCloud, Asiatech, Derak, Afranet, Shatel, MCI).'}
          </p>
        </div>

        {/* Section 3: Monthly History from 2019 */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
            <Database className="w-4 h-4" />
            <span>{isPersian ? '۳. تاریخچه ماه به ماه از سال ۲۰۱۹ تا ۲۰۲۶' : '3. Monthly Trajectory (2019-2026)'}</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {isPersian
              ? 'تمامی دامنه‌های سامانه مجهز به بیش از ۹۰ نقطه داده تاریخی ماهانه هستند که تحولات بزرگ فضای وب ایران (مانند دوره‌های قرنطینه کرونا و رشد انفجاری سفارش آنلاین، اوج‌گیری بازار رمزارز در ۲۰۲۱ و ۲۰۲۴، رونق فصلی اجاره ویلا در بهار و تابستان، و توسعه سوپراپ‌ها) را با دقت بالا نشان می‌دهد.'
              : 'Every domain features over 90 monthly historical points capturing major Internet developments in Iran from 2019 through 2026, including the crypto market surges, seasonal travel patterns, and e-commerce growth.'}
          </p>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors"
          >
            {isPersian ? 'متوجه شدم' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

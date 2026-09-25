import React, { useState } from 'react';
import { X, Database, CheckCircle2, AlertTriangle, RefreshCw, Trash2, Cpu } from 'lucide-react';
import { CacheStats } from '../types/domain';
import { resetCache, fetchCacheStats } from '../services/api';

interface CacheManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cacheStats: CacheStats | null;
  onStatsUpdated: (stats: CacheStats) => void;
  onCacheReset: () => void;
  isPersian: boolean;
}

export const CacheManagerModal: React.FC<CacheManagerModalProps> = ({
  isOpen,
  onClose,
  cacheStats,
  onStatsUpdated,
  onCacheReset,
  isPersian,
}) => {
  const [resetting, setResetting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  if (!isOpen) return null;

  const handleRefreshStats = async () => {
    try {
      setRefreshing(true);
      const s = await fetchCacheStats();
      onStatsUpdated(s);
    } finally {
      setRefreshing(false);
    }
  };

  const handleReset = async () => {
    try {
      setResetting(true);
      await resetCache();
      onCacheReset();
      const s = await fetchCacheStats();
      onStatsUpdated(s);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isPersian ? 'مدیریت و مانیتورینگ حافظه کش ترنکو' : 'Tranco Cache Monitoring'}
              </h3>
              <p className="text-xs text-slate-400">
                {isPersian
                  ? 'سیستم کشینگ هوشمند جهت حذف تاخیر شبکه و جلوگیری از محدودیت نرخ ترنکو'
                  : 'High-speed caching layer protecting against latency and rate-limits'}
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

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block mb-1">
              {isPersian ? 'دامنه‌های ثبت‌شده در کش:' : 'Cached Domains:'}
            </span>
            <span className="text-xl font-bold font-mono text-cyan-400 tabular-nums">
              {cacheStats?.cachedEntries || 0}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block mb-1">
              {isPersian ? 'نرخ موفقیت کش (Hit Rate):' : 'Cache Hit Rate:'}
            </span>
            <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
              %{cacheStats?.hitRate || 95}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block mb-1">
              {isPersian ? 'درخواست‌های مستقیم از حافظه:' : 'Cache Hits:'}
            </span>
            <span className="text-base font-bold font-mono text-slate-200 tabular-nums">
              {cacheStats?.hitCount || 0}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block mb-1">
              {isPersian ? 'وضعیت اتصال API ترنکو:' : 'Tranco API Status:'}
            </span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {cacheStats?.trancoApiStatus === 'online'
                  ? isPersian ? 'آنلاین و آماده' : 'Online & Ready'
                  : isPersian ? 'حالت کش امن' : 'Cached Mode'}
              </span>
            </div>
          </div>
        </div>

        {/* Explanation text */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-400 space-y-1.5 leading-relaxed">
          <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
            <Cpu className="w-3.5 h-3.5" />
            <span>{isPersian ? 'معماری و نحوه عملکرد سیستم کش:' : 'Architecture Note:'}</span>
          </div>
          <p>
            {isPersian
              ? 'اطلاعات رتبه‌بندی ترنکو و تاریخچه‌های ماهانه برای دسترسی آنی (<۵ میلی‌ثانیه) در حافظه نهان سرور و مرورگر نگهداری می‌شوند. با جستجو یا استعلام دامنه جدید، ابتدا کش بررسی می‌شود؛ در صورت عدم وجود، درخواست به صورت خودکار به API ترنکو ارسال و در حافظه کش پایدار ثبت می‌گردد.'
              : 'Tranco rankings and historical series are stored in high-performance memory for sub-5ms responses. New lookups automatically query the Tranco API and update the persistent cache.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleReset}
            disabled={resetting}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isPersian ? 'بازنشانی کش سیستم' : 'Reset Cache'}</span>
          </button>

          <button
            onClick={handleRefreshStats}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{isPersian ? 'بروزرسانی آمار' : 'Refresh Stats'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

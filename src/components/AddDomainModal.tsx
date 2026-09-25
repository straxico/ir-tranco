import React, { useState } from 'react';
import { X, Search, Globe, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { DomainItem } from '../types/domain';
import { lookupDomain } from '../services/api';

interface AddDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDomainAdded: (domain: DomainItem) => void;
  isPersian: boolean;
}

export const AddDomainModal: React.FC<AddDomainModalProps> = ({
  isOpen,
  onClose,
  onDomainAdded,
  isPersian,
}) => {
  const [domainInput, setDomainInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{ domain: DomainItem; cached: boolean } | null>(
    null
  );

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainInput.trim()) return;

    setLoading(true);
    setError(null);
    setSuccessResult(null);

    try {
      const result = await lookupDomain(domainInput.trim());
      setSuccessResult(result);
      onDomainAdded(result.domain);
    } catch {
      setError(
        isPersian
          ? 'خطا در ارتباط با سرویس ترنکو یا دریافت اطلاعات دامنه. لطفا نام دامنه را بررسی کنید.'
          : 'Failed to query Tranco API or fetch domain information. Please check the domain name.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDomainInput('');
    setSuccessResult(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isPersian ? 'استعلام و افزودن دامنه جدید' : 'Lookup / Add New Domain'}
              </h3>
              <p className="text-xs text-slate-400">
                {isPersian
                  ? 'بررسی لحظه‌ای رتبه در فهرست جهانی Tranco و ذخیره‌سازی در کش'
                  : 'Live query from Tranco research list with smart local caching'}
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

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              {isPersian ? 'نام یا نشانی دامنه (مثال: snapp.ir یا alibaba.ir):' : 'Domain Name:'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                placeholder="example.ir or company.com"
                dir="ltr"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm font-mono text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                autoFocus
              />
            </div>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Result Box */}
          {successResult && (
            <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isPersian
                      ? 'دامنه با موفقیت استعلام و به سیستم افزوده شد!'
                      : 'Domain queried and cached successfully!'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {successResult.cached
                    ? isPersian ? 'لود از کش سیستم' : 'From cache'
                    : isPersian ? 'استعلام زنده Tranco' : 'Live query'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400">{isPersian ? 'دامنه:' : 'Domain:'}</span>{' '}
                  <span className="font-mono text-white font-bold">{successResult.domain.domain}</span>
                </div>
                <div>
                  <span className="text-slate-400">{isPersian ? 'رتبه ترنکو:' : 'Tranco Rank:'}</span>{' '}
                  <span className="font-mono text-cyan-400 font-bold tabular-nums">
                    #{successResult.domain.currentRank.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            {successResult ? (
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                {isPersian ? 'استعلام دامنه دیگر' : 'Query Another'}
              </button>
            ) : null}
            <button
              type="submit"
              disabled={loading || !domainInput.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{isPersian ? 'در حال ارتباط با ترنکو...' : 'Querying Tranco...'}</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>{isPersian ? 'شروع استعلام و ذخیره در کش' : 'Fetch & Cache'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

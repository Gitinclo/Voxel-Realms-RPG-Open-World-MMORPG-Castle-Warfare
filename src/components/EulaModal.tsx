/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileText, Scale, Search, ShieldCheck, X } from 'lucide-react';
import {
  EULA_EFFECTIVE_DATE_DISPLAY,
  EULA_LICENSOR_EMAIL,
  EULA_VERSION,
  EulaAcceptanceState,
  EulaCategory,
  evaluateEulaCompliance,
  searchEulaArticles,
} from '../game/eula';

interface EulaModalProps {
  eulaState: EulaAcceptanceState;
  activeAccountEmail: string;
  onAcceptEula: () => void;
  onRevokeEula: () => void;
  onClose: () => void;
}

const CATEGORY_LABELS: { id: EulaCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Articles (10)' },
  { id: 'license', label: 'License & Apache-2.0' },
  { id: 'anti_cheat', label: 'Anti-Cheat Authority' },
  { id: 'cloud_privacy', label: 'Cloud & Gmail OAuth' },
  { id: 'virtual_goods', label: 'Virtual Goods & VIP' },
  { id: 'governance', label: 'Sovereign Governance' },
  { id: 'health', label: 'Photosensitivity' },
  { id: 'liability', label: 'Warranty & Liability' },
];

export const EulaModal: React.FC<EulaModalProps> = ({
  eulaState,
  activeAccountEmail,
  onAcceptEula,
  onRevokeEula,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<EulaCategory | 'all'>('all');

  const compliance = useMemo(() => evaluateEulaCompliance(eulaState), [eulaState]);
  const filteredArticles = useMemo(
    () => searchEulaArticles(searchQuery, selectedCategory),
    [searchQuery, selectedCategory]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-6">
      <div
        data-testid="eula-modal"
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-900 border border-amber-500/40 shadow-2xl overflow-hidden text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 shrink-0">
              <Scale className="w-5 h-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black font-cinzel text-amber-300">
                  End User License Agreement (EULA)
                </h2>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-[10px] font-mono font-bold text-amber-200">
                  v{EULA_VERSION} · {EULA_EFFECTIVE_DATE_DISPLAY}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                Licensor &amp; Root Sovereign Administrator: {EULA_LICENSOR_EMAIL} · Dual-Layer EULA
                + Apache-2.0 Open-Source License
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer shrink-0"
            aria-label="Close EULA Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Compliance Status Banner */}
        <div
          data-testid="eula-compliance-banner"
          className={`px-5 py-3 border-b flex flex-wrap items-center justify-between gap-3 text-xs ${
            compliance.isCompliant
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
              : 'bg-amber-950/60 border-amber-500/40 text-amber-200'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {compliance.isCompliant ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <div className="min-w-0">
              <div className="font-bold">
                {compliance.isCompliant
                  ? `EULA Accepted & Verified (${eulaState.receiptHash})`
                  : 'Action Required: Review & Accept EULA'}
              </div>
              <div className="text-[11px] opacity-90 truncate">{compliance.reason}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {compliance.isCompliant ? (
              <button
                type="button"
                data-testid="eula-revoke-btn"
                onClick={onRevokeEula}
                className="px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-[11px] font-mono font-bold text-slate-300 cursor-pointer"
              >
                Reset Acceptance
              </button>
            ) : null}
            <button
              type="button"
              data-testid="eula-accept-btn"
              onClick={onAcceptEula}
              className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {compliance.isCompliant
                  ? `Re-Confirm EULA (${activeAccountEmail})`
                  : `Accept EULA as ${activeAccountEmail}`}
              </span>
            </button>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/40 space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search EULA articles (e.g., Apache-2.0, anti-cheat, Gmail, virtual goods, creatergame31@gmail.com)..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 outline-none text-xs text-slate-100"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {CATEGORY_LABELS.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Articles Scroll List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {filteredArticles.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No EULA articles matched your filter criteria.
            </div>
          ) : (
            filteredArticles.map((article) => (
              <div
                key={article.id}
                className="rounded-xl bg-slate-950/70 border border-slate-800 p-4 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-black text-xs">
                      Article {article.articleNumber}
                    </span>
                    <h3 className="text-sm font-bold font-cinzel text-amber-200">
                      {article.title}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px] uppercase shrink-0">
                    {article.category.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-xs text-slate-300 font-medium">{article.summary}</p>

                <ul className="space-y-1.5 pt-1 border-t border-slate-800/80">
                  {article.clauses.map((clause, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-slate-300/90 leading-relaxed flex items-start gap-2"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-400/80 shrink-0 mt-0.5" />
                      <span>{clause}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="font-mono text-[11px]">
            Full markdown agreement available in repository root:{' '}
            <span className="text-amber-300 font-bold">EULA.md</span> ·{' '}
            <span className="text-slate-300">TERMS.md</span> ·{' '}
            <span className="text-slate-300">LICENSE.md</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
